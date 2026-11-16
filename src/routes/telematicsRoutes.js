import express from 'express';
import { wrap } from '../utils/http.js';
import { vehicleGpsIngest } from '../services/tripTracking.js';
const router=express.Router();
router.post('/ingest',wrap(vehicleGpsIngest));
export default router;
