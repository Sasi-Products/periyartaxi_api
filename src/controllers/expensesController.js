import { Expense } from "../models/index.js";
import { wrap, positive, num, fail } from "../utils/http.js";
import { branchGuard } from "../middleware/auth.js";
import { audit } from "../services/audit.js";
import { only } from "../utils/validate.js";

export const list =wrap(async(req,res)=>{const where=req.user.role==='ADMIN'?{branchId:req.user.branchId}:req.query.branchId?{branchId:positive(req.query.branchId)}:{};res.json(await Expense.findAll({where,order:[['expenseDate','DESC']],limit:500}))});
export const add =wrap(async(req,res)=>{const branchId=positive(req.body.branchId);branchGuard(req,branchId);const amount=num(req.body.amount,'amount',0.01);if(!req.body.category||!req.body.expenseDate)fail(400,'Category and date required');const x=await Expense.create({...only(req.body,['vehicleId','driverId','category','description','expenseDate']),amount,branchId,createdBy:req.user.id});await audit(req,'EXPENSE_ADDED','Expense',x.id);res.status(201).json(x)});
export const update =wrap(async(req,res)=>{let x=await Expense.findByPk(positive(req.params.id));if(!x)fail(404,'Expense not found');branchGuard(req,x.branchId);if(req.body.amount!==undefined)num(req.body.amount,'amount',0.01);await x.update(only(req.body,['category','description','amount','expenseDate','vehicleId','driverId']));await audit(req,'EXPENSE_UPDATED','Expense',x.id);res.json(x)});
