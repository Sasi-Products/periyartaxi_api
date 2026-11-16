import express from 'express';
import * as c from "../controllers/authController.js";
import { auth } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";
const r=express.Router();
r.post('/login',rateLimit({windowMs:15*60_000,limit:15,standardHeaders:'draft-7',legacyHeaders:false}),c.login);
r.post('/otp/request',rateLimit({windowMs:15*60_000,limit:5,standardHeaders:'draft-7',legacyHeaders:false}),c.otpRequest);
r.post('/otp/verify',rateLimit({windowMs:15*60_000,limit:15,standardHeaders:'draft-7',legacyHeaders:false}),c.otpVerify);
r.get('/me',auth,c.me);r.patch('/me',auth,c.updateMe);r.post('/change-password',auth,c.password);r.post('/logout-all',auth,c.logoutAll);export default r;
