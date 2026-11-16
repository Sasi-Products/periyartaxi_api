import express from 'express';
import * as c from "../controllers/uploadsController.js";
import { auth } from "../middleware/auth.js";
const r=express.Router();r.use(auth);
r.post('/',(req,res,next)=>c.upload(req,res,e=>e?next(e):next()),c.done);r.get('/:filename',c.file);export default r;
