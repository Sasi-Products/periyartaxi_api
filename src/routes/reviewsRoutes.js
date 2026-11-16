import express from 'express';
import * as c from "../controllers/notificationsController.js";
import { auth, role } from "../middleware/auth.js";
const r=express.Router();
r.use(auth,role('CUSTOMER'));r.post('/:id',c.review);export default r;
