import express from 'express';
import * as c from "../controllers/branchesController.js";
import { auth, role } from "../middleware/auth.js";
const r=express.Router();
r.use(auth);r.get('/',c.list);r.post('/',role('SUPER_ADMIN'),c.create);r.patch('/:id',role('SUPER_ADMIN'),c.update);export default r;
