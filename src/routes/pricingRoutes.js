import express from 'express';
import * as c from "../controllers/pricingController.js";
import { auth, role, adminOnly } from "../middleware/auth.js";
const r=express.Router();
r.use(auth);r.get('/',c.list);r.put('/',role('SUPER_ADMIN'),c.save);r.get('/packages',c.packages);r.post('/packages',role('SUPER_ADMIN'),c.addPackage);r.patch('/packages/:id',role('SUPER_ADMIN'),c.editPackage);r.delete('/packages/:id',role('SUPER_ADMIN'),c.deletePackage);export default r;
