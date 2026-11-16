import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User, Otp, DriverProfile, CustomerProfile } from "../models/index.js";
import { fail, wrap } from "../utils/http.js";
import { mobile, requireFields, only } from "../utils/validate.js";
import { sendSms } from "../services/sms.js";
import { findCustomerByPhone } from "../services/customerAccess.js";


const sign=u=>jwt.sign({sub:u.id,ver:u.tokenVersion,role:u.role},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'12h'});
const safe=u=>{const x=u.toJSON();delete x.passwordHash;return x};
export const login =wrap(async(req,res)=>{requireFields(req.body,['username','password']);const u=await User.findOne({where:{username:req.body.username,active:true}});if(!u?.passwordHash||!await bcrypt.compare(req.body.password,u.passwordHash))fail(401,'Incorrect credentials');res.json({token:sign(u),user:safe(u)})});
export const otpRequest =wrap(async(req,res)=>{const m=mobile(req.body.mobile);let recent=await Otp.findOne({where:{mobile:m,usedAt:null},order:[['createdAt','DESC']]});if(recent&&Date.now()-new Date(recent.createdAt).getTime()<60_000)fail(429,'Wait 60 seconds before requesting another OTP');
 const code=String(crypto.randomInt(100000,1000000));const record=await Otp.create({mobile:m,codeHash:await bcrypt.hash(code,10),expiresAt:new Date(Date.now()+Number(process.env.OTP_TTL_MINUTES||5)*60_000)});
 try{await sendSms(m,code)}catch(e){await record.destroy();fail(503,'SMS delivery unavailable; configure provider')};res.json({message:'If the mobile is reachable, an OTP has been sent',expiresInSeconds:Number(process.env.OTP_TTL_MINUTES||5)*60})});
export const otpVerify =wrap(async(req,res)=>{const m=mobile(req.body.mobile),code=String(req.body.otp||'');if(!/^\d{6}$/.test(code))fail(400,'Enter six-digit OTP');let record=await Otp.findOne({where:{mobile:m,usedAt:null},order:[['createdAt','DESC']]});if(!record||record.expiresAt<new Date()||record.attempts>=5)fail(401,'Invalid or expired OTP');await record.increment('attempts');if(!await bcrypt.compare(code,record.codeHash))fail(401,'Invalid or expired OTP');record.usedAt=new Date();await record.save();let u=await findCustomerByPhone(m);if(!u)u=await User.create({name:req.body.name?.trim()||'Customer',mobile:m,role:'CUSTOMER'});if(!u.active||u.role!=='CUSTOMER')fail(403,'Account cannot use customer OTP login');const [profile] = await CustomerProfile.findOrCreate({ where: {userId:u.id}, defaults:{userId:u.id,createdVia:'APP'} });if(!profile.mobileVerifiedAt)await profile.update({mobileVerifiedAt:new Date()});res.json({token:sign(u),user:safe(u)})});
export const me =wrap(async(req,res)=>{const user=safe(req.user);if(req.user.role==='DRIVER')user.driverProfile=await DriverProfile.findOne({where:{userId:req.user.id}});res.json({user})});
export const updateMe =wrap(async(req,res)=>{await req.user.update(only(req.body,['name']));res.json({user:safe(req.user)})});
export const password =wrap(async(req,res)=>{requireFields(req.body,['currentPassword','newPassword']);if(String(req.body.newPassword).length<12)fail(400,'Password must be 12+ characters');if(!req.user.passwordHash||!await bcrypt.compare(req.body.currentPassword,req.user.passwordHash))fail(403,'Incorrect current password');await req.user.update({passwordHash:await bcrypt.hash(req.body.newPassword,12),mustChangePassword:false,tokenVersion:req.user.tokenVersion+1});res.json({message:'Password updated; sign in again'})});
export const logoutAll =wrap(async(req,res)=>{await req.user.increment('tokenVersion');res.json({message:'All sessions revoked'})});
