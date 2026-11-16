import express from 'express';
import * as c from "../controllers/assignmentsController.js";
import { auth, role, adminOnly } from "../middleware/auth.js";
const r=express.Router();
r.use(auth);r.get('/',role('ADMIN','DRIVER'),(req,res,next)=>req.user.role==='ADMIN'?adminOnly('assignments.manage')(req,res,next):next(),c.list);r.post('/',adminOnly('assignments.manage'),c.create);r.delete('/:id',adminOnly('assignments.manage'),c.disable);export default r;
