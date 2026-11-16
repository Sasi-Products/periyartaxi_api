import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { RideOtp, User } from '../models/index.js';
import { fail } from '../utils/http.js';
import { sendSms } from './sms.js';

const OTP_LIFETIME_MS = 5 * 60 * 1000;
const COOLDOWN_MS = 45 * 1000;
const MAX_ATTEMPTS = 5;
export function passengerMobile(ride, customer) {
  // 'Booked for others' uses guest/passenger number rather than booking account number.
  let meta=ride.metadata||{};
  if(typeof meta==='string'){try{meta=JSON.parse(meta)}catch{meta={}}}
  if(meta.passengerNoPhone===true)return null;
  const fromTrip = String(ride.guestMobile || '').trim();
  return /^\+?[0-9]{10,15}$/.test(fromTrip) ? fromTrip : (String(customer?.mobile || '').trim() || null);
}
export function maskedMobile(value) {
  return value ? `••••••${String(value).slice(-4)}` : null;
}
export async function issueRideOtp(ride, stage, requestedBy) {
  if (!['START','END'].includes(stage)) fail(400,'Invalid trip verification stage');
  if (stage === 'START' && !['ASSIGNED','ARRIVING'].includes(ride.status)) fail(409,'Trip is not ready to start');
  if (stage === 'END' && ride.status !== 'IN_PROGRESS') fail(409,'Trip is not in progress');
  const customer = ride.customerId ? await User.findByPk(ride.customerId) : null;
  const mobile = passengerMobile(ride, customer);
  if (!mobile) fail(409,'Passenger has no phone. Use the documented no-phone confirmation flow.');
  const existing = await RideOtp.findOne({where:{rideId:ride.id,stage}});
  if (existing && !existing.usedAt && Date.now() - new Date(existing.issuedAt).getTime() < COOLDOWN_MS) {
    fail(429,'OTP already sent. Please wait before requesting another.');
  }
  const code = String(crypto.randomInt(100000,1000000));
  // Never include OTP in the API response, ride JSON, audit logs, or operator UI.
  await sendSms(mobile, code);
  const values = {
    rideId:ride.id,stage,codeHash:await bcrypt.hash(code,10),destinationHint:maskedMobile(mobile),
    issuedAt:new Date(),expiresAt:new Date(Date.now()+OTP_LIFETIME_MS),usedAt:null,attempts:0,requestedBy,
  };
  if (existing) await existing.update(values); else await RideOtp.create(values);
  return { stage, destinationHint: maskedMobile(mobile), expiresInSeconds: OTP_LIFETIME_MS/1000 };
}
export async function verifyAndConsumeOtp(rideId, stage, entered, transaction) {
  if (!/^\d{6}$/.test(String(entered || ''))) fail(403,'Enter the passenger’s 6-digit OTP');
  const record = await RideOtp.findOne({where:{rideId,stage},transaction,lock:transaction?.LOCK?.UPDATE});
  if (!record || record.usedAt || new Date(record.expiresAt).getTime() <= Date.now()) fail(403,'OTP missing, expired, or already used. Request a new code.');
  if (record.attempts >= MAX_ATTEMPTS) fail(429,'Too many OTP attempts. Request a new code.');
  const match = await bcrypt.compare(String(entered),record.codeHash);
  if (!match) {
    // Keep this count even when lifecycle transaction is rejected.
    await record.update({attempts:record.attempts+1},{transaction});
    // Returning false avoids rolling back the failed-attempt count.
    return false;
  }
  await record.update({usedAt:new Date()},{transaction});
  return true;
}
export function validateAttestation({ride, payload, customerPhone}) {
  if (payload.noPhone === true) {
    if (customerPhone) fail(403,'A passenger contact exists; request the passenger OTP, or request a supervisor emergency override.');
    if (payload.passengerConfirmed !== true) fail(400,'Confirm passenger consent in person');
    const reason = String(payload.reason || '').trim();
    if (reason.length < 12) fail(400,'Provide a meaningful reason for no-phone verification');
    return { type:'NO_PHONE_ATTESTED', reason };
  }
  if (payload.adminOverride === true) {
    const reason = String(payload.reason || '').trim();
    if (reason.length < 15) fail(400,'Provide a reason of at least 15 characters for emergency verification');
    return { type:'ADMIN_EMERGENCY_OVERRIDE', reason };
  }
  return null;
}
