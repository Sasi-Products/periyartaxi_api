import { Payroll, User, Attendance, Ride, RideDriver, sequelize } from "../models/index.js";
import { wrap, fail, positive, num, money } from "../utils/http.js";
import { branchGuard } from "../middleware/auth.js";
import { audit } from "../services/audit.js";
import { DriverProfile } from "../models/index.js";
import _pkg_sequelize from "sequelize";

export const list =wrap(async(req,res)=>{let where={};if(['ADMIN','DRIVER'].includes(req.user.role)&&req.user.role==='DRIVER')where.userId=req.user.id;else if(req.user.role==='ADMIN')where.branchId=req.user.branchId;if(req.query.period)where.period=req.query.period;res.json(await Payroll.findAll({where,order:[['period','DESC']],limit:500}))});
export const upsert =wrap(async(req,res)=>{const user=await User.findByPk(positive(req.body.userId));if(!user||!['ADMIN','DRIVER'].includes(user.role))fail(404,'Staff missing');branchGuard(req,user.branchId);const period=String(req.body.period||'');if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))fail(400,'Period must be YYYY-MM');
 let row=await Payroll.findOne({where:{userId:user.id,period}});if(row&&row.status!=='DRAFT')fail(409,'Cannot edit approved or paid payroll');let base=num(req.body.baseAmount,'base amount'),incentives=num(req.body.incentives||0,'incentives'),deductions=num(req.body.deductions||0,'deductions');const net=money(base+incentives-deductions);if(net<0)fail(422,'Net salary cannot be negative');if(row)await row.update({baseAmount:base,incentives,deductions,netAmount:net,notes:req.body.notes});else row=await Payroll.create({userId:user.id,branchId:user.branchId,period,baseAmount:base,incentives,deductions,netAmount:net,notes:req.body.notes});await audit(req,'PAYROLL_DRAFT','Payroll',row.id);res.json(row)});
export const status =wrap(async(req,res)=>{const r=await Payroll.findByPk(positive(req.params.id));if(!r)fail(404,'Payroll record not found');branchGuard(req,r.branchId);const next=req.body.status;if(!({DRAFT:['APPROVED'],APPROVED:['PAID'],PAID:[]}[r.status]||[]).includes(next))fail(409,'Invalid payroll transition');await r.update({status:next,paidAt:next==='PAID'?new Date():null});await audit(req,'PAYROLL_STATUS','Payroll',r.id);res.json(r)});
export const staffSummary =wrap(async(req,res)=>{const user=await User.findByPk(positive(req.params.userId));if(!user)fail(404,'Staff missing');branchGuard(req,user.branchId);const period=req.query.period||new Date().toISOString().slice(0,7);const attend=await Attendance.findAll({where:{userId:user.id}});let rows=attend.filter(a=>a.day.startsWith(period));res.json({period,staff:user.name,daysPresent:rows.filter(a=>a.status==='PRESENT').length,halfDays:rows.filter(a=>a.status==='HALF_DAY').length,absentDays:rows.filter(a=>a.status==='ABSENT').length,paidLeaveDays:rows.filter(a=>a.status==='LEAVE').length,method:'Manual payroll draft; review incentives/deductions before approval'})});
export const autoDraft =wrap(async(req,res)=>{
 const user=await User.findByPk(positive(req.body.userId));if(!user||!['ADMIN','DRIVER'].includes(user.role))fail(404,'Staff missing');branchGuard(req,user.branchId);
 const period=String(req.body.period||'');if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))fail(400,'Period must be YYYY-MM');
 const current=await Payroll.findOne({where:{userId:user.id,period}});if(current&&current.status!=='DRAFT')fail(409,'Approved payroll cannot be overwritten');
 const profile=user.role==='DRIVER'?await DriverProfile.findOne({where:{userId:user.id}}):null;
 const type=profile?.salaryType||user.salaryType||'MONTHLY',rate=Number(profile?.salaryRate??user.salaryRate??0);
 if(!Number.isFinite(rate)||rate<0)fail(400,'Configure a valid salary rate before generating');
 const attendance=(await Attendance.findAll({where:{userId:user.id}})).filter(a=>a.day.startsWith(period));
 const present=attendance.reduce((a,r)=>a+(r.status==='PRESENT'?1:r.status==='HALF_DAY'?.5:0),0);
 let units=1;
 if(type==='DAILY')units=present;
 if(type==='HOURLY')units=attendance.reduce((a,r)=>a+(r.checkInAt&&r.checkOutAt?Math.max(0,(new Date(r.checkOutAt)-new Date(r.checkInAt))/3600000):0),0);
 if(type==='PER_TRIP'){
  const [year,month]=period.split('-').map(Number);const start=new Date(Date.UTC(year,month-1,1)),end=new Date(Date.UTC(year,month,1));
  const rideIds=user.role==='DRIVER'?(await RideDriver.findAll({where:{driverId:user.id}})).map(x=>x.rideId):[];
  units=await Ride.count({where:{id:rideIds,status:'COMPLETED',endedAt:{[_pkg_sequelize.Op.gte]:start,[_pkg_sequelize.Op.lt]:end}}});
 }
 const base=money(rate*units);const data={userId:user.id,branchId:user.branchId,period,baseAmount:base,incentives:0,deductions:0,netAmount:base,status:'DRAFT',notes:`Auto draft: ${type} rate ${rate} × ${units.toFixed(2)} units. Review before approval.`};
 const row=current?(await current.update(data)):await Payroll.create(data);await audit(req,'PAYROLL_AUTO_DRAFT','Payroll',row.id);res.json({payroll:row,calculation:{type,rate,units,presentDays:present}});
});
