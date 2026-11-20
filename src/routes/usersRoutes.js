import express from 'express';
import * as c from "../controllers/usersController.js";
import * as docs from '../controllers/staffDocumentsController.js';
import {staffUpload} from '../services/staffFiles.js';
import { auth, adminOnly, role } from "../middleware/auth.js";
const r=express.Router();
r.use(auth);r.get('/',adminOnly('users.manage'),c.list);r.post('/',adminOnly('users.manage'),c.create);r.patch('/:id',adminOnly('users.manage'),c.update);r.put('/:id/permissions',role('SUPER_ADMIN'),c.permissions);r.get('/:id/documents',adminOnly('users.manage'),docs.list);r.post('/:id/documents',adminOnly('users.manage'),staffUpload,docs.upload);r.get('/:id/documents/:documentId',adminOnly('users.manage'),docs.download);r.delete('/:id/documents/:documentId',adminOnly('users.manage'),docs.remove);export default r;
