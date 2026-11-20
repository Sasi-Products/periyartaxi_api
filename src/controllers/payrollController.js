import {Payroll,User,Attendance,DriverProfile} from '../models/index.js';
import {wrap,fail,positive,num,money} from '../utils/http.js';
import {branchGuard} from '../middleware/auth.js';
import {audit} from '../services/audit.js';
import {payPeriod,inPeriod} from '../utils/payPeriod.js';
const paymentMethods=['CASH','BANK_TRANSFER','UPI','CHEQUE'];
async function employee(req,id){const u=await User.findByPk(positive(id,'employee ID'));if(!u||!['ADMIN','DRIVER'].includes(u.role))fail(404,'Employee not found');branchGuard(req,u.branchId);return u}
async function profile(u){return u.role==='DRIVER'?await DriverProfile.findOne({where:{userId:u.id}}):null}
const nonneg=(v,label)=>num(v??0,label,0);
function compose(body,defaultRate=0){
 const baseAmount=nonneg(body.baseAmount,'base salary'),incentives=nonneg(body.incentives,'incentives'),deductions=nonneg(body.deductions,'deductions');
 const overtimeHours=nonneg(body.overtimeHours,'overtime hours'),overtimeRate=nonneg(body.overtimeRate??defaultRate,'overtime rate');
 if(overtimeHours>400)fail(400,'Overtime hours exceed reasonable monthly limit');
 const overtimeAmount=money(overtimeHours*overtimeRate),netAmount=money(baseAmount+incentives+overtimeAmount-deductions);
 if(netAmount<0)fail(422,'Net payroll cannot be negative');
 return {baseAmount,incentives,deductions,overtimeHours,overtimeRate,overtimeAmount,netAmount,notes:String(body.notes||'').slice(0,2000)};
}
export const list=wrap(async(req,res)=>{let where={};if(req.user.role==='DRIVER')where.userId=req.user.id;else if(req.user.role==='ADMIN')where.branchId=req.user.branchId;if(req.query.period)where.period=payPeriod(req.query.period).period;res.json(await Payroll.findAll({where,order:[['createdAt','DESC']],limit:500}));});
export const staffSummary=wrap(async(req,res)=>{
 const u=await employee(req,req.params.userId),period=payPeriod(req.query.period||new Date().toISOString().slice(0,7));
 const a=(await Attendance.findAll({where:{userId:u.id}})).filter(r=>inPeriod(r.day,period));
 res.json({period:period.period,employee:u.name,daysPresent:a.filter(r=>r.status==='PRESENT').length,halfDays:a.filter(r=>r.status==='HALF_DAY').length,leaveDays:a.filter(r=>r.status==='LEAVE').length,attendance:a});
});
export const upsert=wrap(async(req,res)=>{
 const u=await employee(req,req.body.userId),period=payPeriod(req.body.period),p=await profile(u);
 if(p?.salaryType==='WEEKLY'&&period.kind!=='WEEK')fail(400,'Weekly driver salary requires weekly pay period');
 if(p?.salaryType==='MONTHLY'&&period.kind!=='MONTH')fail(400,'Monthly driver salary requires monthly pay period');
 const data=compose(req.body,p?.overtimeRate||0);
 let r=await Payroll.findOne({where:{userId:u.id,period:period.period}});if(r&&r.status!=='DRAFT')fail(409,'Approved or paid salary is locked');
 if(r) await r.update(data);else r=await Payroll.create({...data,period:period.period,userId:u.id,branchId:u.branchId,status:'DRAFT'});
 await audit(req,'PAYROLL_DRAFT','Payroll',r.id);res.json(r);
});
export const autoDraft=wrap(async(req,res)=>{
 const u=await employee(req,req.body.userId),period=payPeriod(req.body.period),p=await profile(u);
 const type=p?.salaryType||u.salaryType||'MONTHLY',rate=nonneg(p?.salaryRate??u.salaryRate??0,'salary rate');
 if(type==='WEEKLY'&&period.kind!=='WEEK')fail(400,'Choose an ISO week for weekly-paid drivers');
 if(type==='MONTHLY'&&period.kind!=='MONTH')fail(400,'Choose a calendar month for monthly-paid drivers');
 let current=await Payroll.findOne({where:{userId:u.id,period:period.period}});if(current&&current.status!=='DRAFT')fail(409,'Cannot overwrite approved payroll');
 const rows=(await Attendance.findAll({where:{userId:u.id}})).filter(a=>inPeriod(a.day,period));
 const paidDays=rows.reduce((s,a)=>s+(a.status==='PRESENT'?1:a.status==='HALF_DAY'?0.5:0),0);
 // Weekly rate is one payroll week; monthly rate is one month. Daily is days with attendance.
 // Historical PER_TRIP/HOURLY pay types are no longer selectable for drivers; old records must be reviewed manually.
 if(['PER_TRIP','HOURLY'].includes(type)&&u.role==='DRIVER')fail(422,'Legacy driver salary type must be updated to Monthly/Weekly/Daily');
 const units=type==='DAILY'?paidDays:1;
 const baseAmount=money(rate*units),computed=compose({baseAmount,incentives:0,deductions:0,overtimeHours:req.body.overtimeHours??0,overtimeRate:req.body.overtimeRate??p?.overtimeRate??0,notes:`Auto draft: ${type} rate ${rate} × ${units} units. Attendance ${paidDays} days; review overtime and deductions.`});
 const payload={...computed,period:period.period,userId:u.id,branchId:u.branchId,status:'DRAFT'};
 const r=current?await current.update(payload):await Payroll.create(payload);
 await audit(req,'PAYROLL_AUTO_DRAFT','Payroll',r.id);res.json({payroll:r,calculation:{type,rate,units,paidDays}});
});
export const status=wrap(async(req,res)=>{
 const r=await Payroll.findByPk(positive(req.params.id));if(!r)fail(404,'Payroll not found');branchGuard(req,r.branchId);
 const status=String(req.body.status||'');if(!({DRAFT:['APPROVED'],APPROVED:['PAID'],PAID:[]}[r.status]||[]).includes(status))fail(409,'Invalid salary transition');
 const changes={status};
 if(status==='PAID'){
  if(!paymentMethods.includes(req.body.paymentMethod))fail(400,'Choose salary payment method');
  const reference=String(req.body.paymentReference||'').trim().slice(0,140);
  if(req.body.paymentMethod!=='CASH' && reference.length<4)fail(400,'Payment transaction/reference required');
  changes.paymentMethod=req.body.paymentMethod;changes.paymentReference=reference||null;changes.paymentNotes=String(req.body.paymentNotes||'').slice(0,1000);changes.paidAt=new Date();changes.paidBy=req.user.id;
 }
 await r.update(changes);await audit(req,'PAYROLL_STATUS','Payroll',r.id,null,{status,method:changes.paymentMethod||null});res.json(r);
});
