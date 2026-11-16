import SequelizePkg from 'sequelize';
const { Op } = SequelizePkg;
import { Ride, RideDriver, RideWaitInterval, RideEvent, User, sequelize } from '../models/index.js';
import { wrap, fail, positive } from '../utils/http.js';
import { branchGuard, hasPermission } from '../middleware/auth.js';
import { issueRideOtp, passengerMobile } from '../services/rideVerification.js';
import { addTripGpsSample } from '../services/tripTracking.js';
import { tripTiming } from '../services/rideTiming.js';
import { recalculate } from '../services/rideFinance.js';
import { audit } from '../services/audit.js';

export async function evidenceAccess(req,ride,action = false) {
  if (!ride) fail(404,'Trip not found');
  const role = req.user.role;
  if (role === 'CUSTOMER') {
    if (action || Number(ride.customerId) !== Number(req.user.id)) fail(403,'Not authorized');
  } else if (role === 'DRIVER') {
    const assigned = ride.assignedDriverId === req.user.id || await RideDriver.count({where:{rideId:ride.id,driverId:req.user.id,status:'ASSIGNED'}});
    if (!assigned) fail(403,'Not assigned to this trip');
  } else if (role === 'ADMIN') {
    branchGuard(req,ride.branchId);
    if (!hasPermission(req.user,action?'trips.override':'trips.view')) fail(403,'Missing trip permission');
  } else if (role !== 'SUPER_ADMIN') fail(403,'Not authorized');
}
export const timing = wrap(async(req,res) => {
  const ride=await Ride.findByPk(positive(req.params.id));await evidenceAccess(req,ride);
  const result=await tripTiming(ride);
  const waits=await RideWaitInterval.findAll({where:{rideId:ride.id},order:[['id','ASC']]});
  res.json({ ...result, waits, pricing: ride.metadata?.timing || null });
});
export const requestOtp = wrap(async(req,res) => {
  const ride=await Ride.findByPk(positive(req.params.id));await evidenceAccess(req,ride);
  if(req.user.role==='ADMIN'&&!hasPermission(req.user,'trips.override'))fail(403,'Missing trip verification permission');
  const stage=String(req.body.stage || '').toUpperCase();
  const result=await issueRideOtp(ride,stage,req.user.id);
  await RideEvent.create({rideId:ride.id,actorId:req.user.id,event:`${stage}_OTP_REQUESTED`,message:`OTP sent to ${result.destinationHint}`});
  res.json({message:'Verification code sent to passenger',...result});
});
export const gps = wrap(async(req,res) => {
  const ride=await Ride.findByPk(positive(req.params.id));
  if (req.user.role !== 'DRIVER') fail(403,'Only the assigned driver can submit phone telemetry');
  await evidenceAccess(req,ride,true);
  res.status(201).json(await addTripGpsSample(ride,req.body,'DRIVER_PHONE',req.user.id));
});
function ensureInProgress(ride){if(ride.status!=='IN_PROGRESS')fail(409,'Trip is not in progress');}
const meaningful = (s, min=8) => {const v=String(s||'').trim();if(v.length<min)fail(400,`Explain the reason (${min}+ characters)`);return v.slice(0,240)};
const overlaps = (a,b,c,d) => new Date(a)<new Date(d)&&new Date(c)<new Date(b);
async function assertNoOverlap(rideId,from,to,exceptId=null) {
  const others=await RideWaitInterval.findAll({where:{rideId,status:{[Op.ne]:'REJECTED'}}});
  if (others.some(w=>w.id!==exceptId && overlaps(from,to,w.startedAt,w.endedAt || new Date()))) fail(409,'Waiting interval overlaps another recorded waiting period');
}
export const beginWait = wrap(async(req,res) => {
  const ride=await Ride.findByPk(positive(req.params.id));await evidenceAccess(req,ride,true);ensureInProgress(ride);
  const active=await RideWaitInterval.findOne({where:{rideId:ride.id,endedAt:null,status:{[Op.ne]:'REJECTED'}}});
  if(active)fail(409,'Waiting timer already active');
  const record=await RideWaitInterval.create({rideId:ride.id,startedAt:new Date(),reason:meaningful(req.body.reason),source:req.user.role==='DRIVER'?'DRIVER':'OPERATOR',status:'PENDING',createdBy:req.user.id});
  await RideEvent.create({rideId:ride.id,actorId:req.user.id,event:'WAITING_STARTED',payload:{waitId:record.id,reason:record.reason}});
  res.status(201).json(record);
});
export const endWait = wrap(async(req,res) => {
  const ride=await Ride.findByPk(positive(req.params.id));await evidenceAccess(req,ride,true);ensureInProgress(ride);
  const record=await RideWaitInterval.findOne({where:{rideId:ride.id,endedAt:null,status:'PENDING'}});
  if(!record)fail(409,'No active waiting interval');
  await record.update({endedAt:new Date(),note:String(req.body.note||'').slice(0,500)});
  await RideEvent.create({rideId:ride.id,actorId:req.user.id,event:'WAITING_ENDED',payload:{waitId:record.id}});
  res.json(record);
});
export const manualWait = wrap(async(req,res) => {
  const ride=await Ride.findByPk(positive(req.params.id));
  if(!['SUPER_ADMIN','ADMIN'].includes(req.user.role))fail(403,'Operator only');
  await evidenceAccess(req,ride,true);
  if(!ride.startedAt)fail(409,'Trip has not started');
  const from=new Date(req.body.startedAt),to=new Date(req.body.endedAt),end=ride.endedAt || new Date();
  if(!Number.isFinite(from.getTime())||!Number.isFinite(to.getTime())||from<new Date(ride.startedAt)||to>end||to<=from)fail(400,'Waiting times must be within the actual trip');
  await assertNoOverlap(ride.id,from,to);
  const record=await RideWaitInterval.create({rideId:ride.id,startedAt:from,endedAt:to,reason:meaningful(req.body.reason,12),source:'OPERATOR',status:'APPROVED',createdBy:req.user.id,reviewedBy:req.user.id,reviewedAt:new Date()});
  await audit(req,'MANUAL_WAIT_ADDED','RideWaitInterval',record.id,null,record.toJSON());
  if(ride.status==='COMPLETED')await recalculate(ride);
  res.status(201).json(record);
});
export const reviewWait = wrap(async(req,res) => {
  const ride=await Ride.findByPk(positive(req.params.id));
  if(!['ADMIN','SUPER_ADMIN'].includes(req.user.role))fail(403,'Operator only');
  await evidenceAccess(req,ride,true);
  const record=await RideWaitInterval.findOne({where:{id:positive(req.params.waitId),rideId:ride.id}});
  if(!record)fail(404,'Waiting period not found');
  if(!record.endedAt)fail(409,'Stop the waiting timer before approving');
  if(record.status!=='PENDING')fail(409,'Waiting interval has already been reviewed');
  const approve=req.body.approve===true;
  await record.update({status:approve?'APPROVED':'REJECTED',reviewedBy:req.user.id,reviewedAt:new Date(),note:String(req.body.note||record.note||'').slice(0,500)});
  await audit(req,approve?'WAIT_APPROVED':'WAIT_REJECTED','RideWaitInterval',record.id);
  if(ride.status==='COMPLETED')await recalculate(ride);
  res.json(record);
});

export const verifyDistance = wrap(async(req,res) => {
  const ride=await Ride.findByPk(positive(req.params.id));
  if(!['SUPER_ADMIN','ADMIN'].includes(req.user.role))fail(403,'Operator only');
  await evidenceAccess(req,ride,true);
  if(!ride.startedAt)fail(409,'Trip not yet started');
  const reason=meaningful(req.body.reason,12);
  let verifiedDistanceKm;
  let readings={};
  if(req.body.odometerStartKm!==undefined || req.body.odometerEndKm!==undefined){
    const begin=Number(req.body.odometerStartKm), end=Number(req.body.odometerEndKm);
    if(!Number.isFinite(begin)||!Number.isFinite(end)||begin<0||end<begin||end-begin>5000)fail(400,'Invalid odometer readings');
    verifiedDistanceKm=end-begin;
    readings={odometerStartKm:begin,odometerEndKm:end};
  } else {
    verifiedDistanceKm=Number(req.body.distanceKm);
    if(!Number.isFinite(verifiedDistanceKm)||verifiedDistanceKm<0||verifiedDistanceKm>5000)fail(400,'Invalid manually verified kilometres');
  }
  const prev=typeof ride.metadata==='string'?JSON.parse(ride.metadata||'{}'):{...(ride.metadata||{})};
  await ride.update({metadata:{...prev,...readings,verifiedDistanceKm,distanceApprovedBy:req.user.id,manualDistanceReason:reason}});
  await audit(req,'TRIP_DISTANCE_VERIFIED','Ride',ride.id,{distance:prev.verifiedDistanceKm??null},{distanceKm:verifiedDistanceKm,reason,...readings});
  if(ride.status==='COMPLETED')await recalculate(ride);
  res.json({verifiedDistanceKm,ride});
});
