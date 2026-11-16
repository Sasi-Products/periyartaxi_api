import express from 'express';
import * as c from "../controllers/notificationsController.js";
import { auth, adminOnly } from "../middleware/auth.js";
const r=express.Router();
r.use(auth);r.get('/',adminOnly('audit.view'),c.audit);export default r;
