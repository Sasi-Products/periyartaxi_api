import express from 'express';
import * as c from "../controllers/paymentsController.js";
import { auth, role, adminOnly } from "../middleware/auth.js";
const r=express.Router();
r.use(auth);r.get('/',role('CUSTOMER','ADMIN','DRIVER'),(req,res,next)=>req.user.role==='ADMIN'?adminOnly('payments.manage')(req,res,next):next(),c.list);
r.post('/cash/:rideId',role('DRIVER','ADMIN'),(req,res,next)=>req.user.role==='ADMIN'?adminOnly('payments.manage')(req,res,next):next(),c.cash);
r.post('/order/:rideId',role('CUSTOMER','ADMIN'),(req,res,next)=>req.user.role==='ADMIN'?adminOnly('payments.manage')(req,res,next):next(),c.createOrder);
r.post('/verify',role('CUSTOMER','ADMIN'),(req,res,next)=>req.user.role==='ADMIN'?adminOnly('payments.manage')(req,res,next):next(),c.verify);export default r;
