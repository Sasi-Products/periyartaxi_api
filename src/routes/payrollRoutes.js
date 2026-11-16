import express from 'express';
import * as c from "../controllers/payrollController.js";
import { auth, role, adminOnly } from "../middleware/auth.js";
const r=express.Router();
r.use(auth);r.get('/',role('ADMIN','DRIVER'),(req,res,next)=>req.user.role==='ADMIN'?adminOnly('payroll.manage')(req,res,next):next(),c.list);r.get('/staff/:userId',adminOnly('payroll.manage'),c.staffSummary);r.post('/',adminOnly('payroll.manage'),c.upsert);r.post('/auto-draft',adminOnly('payroll.manage'),c.autoDraft);r.post('/:id/status',adminOnly('payroll.manage'),c.status);export default r;
