import express from 'express';
import * as c from "../controllers/analyticsController.js";
import { auth, adminOnly } from "../middleware/auth.js";
const r=express.Router();
r.use(auth);r.get('/',adminOnly('analytics.view'),c.dashboard);r.get('/details',adminOnly('analytics.view'),c.details);export default r;
