import _pkg_sequelize from "sequelize";
import { Ride, Payment, Expense, Payroll, User, Vehicle, DriverProfile, Attendance, RideCharge, Branch } from "../models/index.js";
import { wrap, positive, money } from "../utils/http.js";
const {Op,fn,col} = _pkg_sequelize;
export const dashboard =wrap(async(req,res)=>{
 const branchId=req.user.role==='ADMIN'?req.user.branchId:req.query.branchId?positive(req.query.branchId):null;
 const where=branchId?{branchId}:{};
 const since=req.query.from?new Date(req.query.from):new Date(Date.now()-30*86400000),until=req.query.to?new Date(req.query.to):new Date();
 const rides=await Ride.findAll({where:{...where,createdAt:{[Op.between]:[since,until]}}});const rideIds=rides.map(x=>x.id);
 const payments=rideIds.length?await Payment.findAll({where:{rideId:{[Op.in]:rideIds},status:'SUCCESS'}}):[];
 const expenses=await Expense.findAll({where:{...where,expenseDate:{[Op.between]:[since.toISOString().slice(0,10),until.toISOString().slice(0,10)]}}});
 const payroll=await Payroll.findAll({where:{...where,status:'PAID',paidAt:{[Op.between]:[since,until]}}});
 const completed=rides.filter(x=>x.status==='COMPLETED');const paid=payments.reduce((sum,x)=>sum+Number(x.amount),0),operatingExpense=expenses.reduce((sum,x)=>sum+Number(x.amount),0),salary=payroll.reduce((sum,x)=>sum+Number(x.netAmount),0);
 const byService={};for(const r of rides){const s=r.service;if(!byService[s])byService[s]={total:0,completed:0,estimatedRevenue:0};byService[s].total++;if(r.status==='COMPLETED')byService[s].completed++;byService[s].estimatedRevenue+=Number(r.finalFare||r.estimatedFare||0)}
 const byStatus={};for(const r of rides)byStatus[r.status]=(byStatus[r.status]||0)+1;
 res.json({period:{from:since,to:until},counts:{rides:rides.length,completed:completed.length,cancelled:byStatus.CANCELLED||0,customers:await User.count({where:{role:'CUSTOMER'}}),drivers:await User.count({where:{role:'DRIVER',...(branchId?{branchId}:{})}}),vehicles:await Vehicle.count({where}),pendingVerifications:await DriverProfile.count({where:{verification:'PENDING'}})},finance:{cashAndGatewayCollected:money(paid),operatingExpenses:money(operatingExpense),paidSalaries:money(salary),cashSurplusBeforeOtherCosts:money(paid-operatingExpense-salary),unpaidTripBalances:money(completed.reduce((a,r)=>a+Number(r.finalFare||r.estimatedFare||0),0)-paid)},byService,byStatus});
});
export const details =wrap(async(req,res)=>{
 const branchId=req.user.role==='ADMIN'?req.user.branchId:req.query.branchId?positive(req.query.branchId):null;
 const where=branchId?{branchId}:{};const from=req.query.from?new Date(req.query.from):new Date(Date.now()-30*86400000),to=req.query.to?new Date(req.query.to):new Date();
 if(!Number.isFinite(from.getTime())||!Number.isFinite(to.getTime())||from>to)throw Object.assign(new Error('Invalid date range'),{status:400});
 const rides=await Ride.findAll({where:{...where,createdAt:{[Op.between]:[from,to]}}});
 const grouped=(keyOf)=>{const result={};for(const r of rides){const id=String(keyOf(r)||'UNASSIGNED');const row=result[id]||{id,bookings:0,completed:0,cancelled:0,grossFare:0};row.bookings++;if(r.status==='COMPLETED')row.completed++;if(r.status==='CANCELLED')row.cancelled++;if(r.status==='COMPLETED')row.grossFare+=Number(r.finalFare||r.estimatedFare||0);result[id]=row;}return Object.values(result).sort((a,b)=>b.bookings-a.bookings)};
 const users=await User.findAll({where:{...(branchId?{branchId}:{}),role:'DRIVER'},attributes:['id','name']});
 const cars=await Vehicle.findAll({where,attributes:['id','registration','brand','name']});
 const customers=await User.findAll({where:{role:'CUSTOMER'},attributes:['id','name']});
 const named=(rows,records,key)=>rows.map(r=>({...r,name:records.find(x=>String(x.id)===r.id)?.[key]||r.id}));
 const payments=await Payment.findAll({where:{status:'SUCCESS',createdAt:{[Op.between]:[from,to]}}});const rideIds=new Set(rides.map(r=>r.id));const matched=payments.filter(p=>rideIds.has(p.rideId));
 const expenses=await Expense.findAll({where:{...where,expenseDate:{[Op.between]:[from.toISOString().slice(0,10),to.toISOString().slice(0,10)]}}});const pay=await Payroll.findAll({where:{...where,status:'PAID',paidAt:{[Op.between]:[from,to]}}});
 const categories={};for(const x of expenses)categories[x.category]=money((categories[x.category]||0)+Number(x.amount));
 const cash=matched.filter(x=>x.method==='CASH').reduce((a,x)=>a+Number(x.amount),0),online=matched.filter(x=>x.method==='RAZORPAY').reduce((a,x)=>a+Number(x.amount),0);
 res.json({period:{from,to},drivers:named(grouped(r=>r.assignedDriverId),users,'name'),vehicles:named(grouped(r=>r.vehicleId),cars,'registration'),customers:named(grouped(r=>r.customerId),customers,'name'),services:named(grouped(r=>r.service),[],'name'),finance:{cashCollected:money(cash),razorpayCollected:money(online),expenseCategories:categories,payroll:money(pay.reduce((a,p)=>a+Number(p.netAmount),0)),expenses:money(expenses.reduce((a,e)=>a+Number(e.amount),0))},notes:'Cash-based collections; not an accrual profit-and-loss statement.'});
});
