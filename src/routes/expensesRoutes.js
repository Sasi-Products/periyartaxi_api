import express from 'express';
import * as c from "../controllers/expensesController.js";
import { auth, adminOnly } from "../middleware/auth.js";
const r=express.Router();
r.use(auth);r.get('/',adminOnly('expenses.manage'),c.list);r.post('/',adminOnly('expenses.manage'),c.add);r.patch('/:id',adminOnly('expenses.manage'),c.update);export default r;
