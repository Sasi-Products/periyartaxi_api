import express from 'express';
import * as c from "../controllers/usersController.js";
import { auth, adminOnly, role } from "../middleware/auth.js";
const r=express.Router();
r.use(auth);r.get('/',adminOnly('users.manage'),c.list);r.post('/',adminOnly('users.manage'),c.create);r.patch('/:id',adminOnly('users.manage'),c.update);r.put('/:id/permissions',role('SUPER_ADMIN'),c.permissions);export default r;
