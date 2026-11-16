import express from 'express';
import * as c from "../controllers/notificationsController.js";
import { auth, role, adminOnly } from "../middleware/auth.js";
const r=express.Router();
r.use(auth);r.get('/',c.list);r.patch('/:id/read',c.read);r.post('/device',c.registerDevice);r.post('/send',adminOnly('notifications.send'),c.send);export default r;
