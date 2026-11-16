import express from 'express';
import * as c from "../controllers/attendanceController.js";
import { auth, role, adminOnly } from "../middleware/auth.js";
const r=express.Router();
r.use(auth);r.post('/in',role('ADMIN','DRIVER'),c.clockIn);r.post('/out',role('ADMIN','DRIVER'),c.clockOut);r.get('/',role('ADMIN','DRIVER'),(req,res,next)=>req.user.role==='ADMIN'?adminOnly('attendance.manage')(req,res,next):next(),c.list);r.post('/mark',adminOnly('attendance.manage'),c.mark);export default r;
