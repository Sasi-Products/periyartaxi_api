import express from 'express';
import * as c from "../controllers/locationController.js";
import { auth, role, adminOnly } from "../middleware/auth.js";
const r=express.Router();
r.use(auth);r.post('/me',role('DRIVER'),c.update);r.get('/:driverId',adminOnly('locations.view'),c.one);export default r;
