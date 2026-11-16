import _pkg_sequelize from "sequelize";
import { Attendance, DriverShift, DriverProfile, User } from "../models/index.js";
import { wrap, fail, positive } from "../utils/http.js";
import { branchGuard } from "../middleware/auth.js";
const {Op} = _pkg_sequelize;
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
export const clockIn =wrap(async(req,res)=>{const u=req.user;if(u.role==='CUSTOMER')fail(403,'Staff only');const day=today();if(u.role==='DRIVER'&&!await DriverProfile.count({where:{userId:u.id,verification:'APPROVED'}}))fail(403,'Unverified driver');let row=await Attendance.findOne({where:{userId:u.id,day}});if(row?.checkInAt)fail(409,'Already clocked in today');if(!row)row=await Attendance.create({userId:u.id,branchId:u.branchId,day,checkInAt:new Date()});else await row.update({checkInAt:new Date(),checkOutAt:null,status:'PRESENT'});
 if(u.role==='DRIVER'){await DriverShift.create({driverId:u.id,branchId:u.branchId,startsAt:new Date()});}res.json(row)});
export const clockOut =wrap(async(req,res)=>{const row=await Attendance.findOne({where:{userId:req.user.id,day:today()}});if(!row?.checkInAt||row.checkOutAt)fail(409,'Not clocked in');await row.update({checkOutAt:new Date()});if(req.user.role==='DRIVER'){await DriverShift.update({active:false,endsAt:new Date()},{where:{driverId:req.user.id,active:true}});await DriverProfile.update({available:false},{where:{userId:req.user.id}})}res.json(row)});
export const list =wrap(async(req,res)=>{let where={};if(req.user.role==='DRIVER')where.userId=req.user.id;else if(req.user.role==='ADMIN')where.branchId=req.user.branchId;else if(req.query.branchId)where.branchId=positive(req.query.branchId);
 if(req.query.userId&&req.user.role!=='DRIVER'){const u=await User.findByPk(positive(req.query.userId));if(!u)fail(404,'Staff not found');branchGuard(req,u.branchId);where.userId=u.id}
 res.json(await Attendance.findAll({where,order:[['day','DESC']],limit:400}))});
export const mark =wrap(async(req,res)=>{const u=await User.findByPk(positive(req.body.userId));if(!u||!['ADMIN','DRIVER'].includes(u.role))fail(404,'Staff not found');branchGuard(req,u.branchId);const day=String(req.body.day||today());if(!/^\d{4}-\d{2}-\d{2}$/.test(day))fail(400,'Use YYYY-MM-DD');if(!['PRESENT','ABSENT','LEAVE','HALF_DAY'].includes(req.body.status))fail(400,'Invalid status');let [r]=await Attendance.findOrCreate({where:{userId:u.id,day},defaults:{branchId:u.branchId,status:req.body.status}});await r.update({status:req.body.status,notes:req.body.notes||null});res.json(r)});
