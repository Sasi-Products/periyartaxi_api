import crypto from 'node:crypto';
import { Ride, RideDriver, RideGpsSample, RideEvent } from '../models/index.js';
import { fail } from '../utils/http.js';
import { validPoint } from '../utils/geo.js';

function tokenEqual(a, b) {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && x.length >= 32 && crypto.timingSafeEqual(x,y);
}
export async function addTripGpsSample(ride, payload, source, driverId = null) {
  if (ride.status !== 'IN_PROGRESS') fail(409,'GPS samples are accepted only while the ride is in progress');
  const point = {lat:Number(payload.lat), lng:Number(payload.lng)};
  if (!validPoint(point)) fail(400,'Invalid GPS coordinates');
  const accuracyM = payload.accuracyM == null ? null : Number(payload.accuracyM);
  const speedKmh = payload.speedKmh == null ? null : Number(payload.speedKmh);
  if (accuracyM != null && (!Number.isFinite(accuracyM) || accuracyM < 0 || accuracyM > 3000)) fail(400,'Invalid GPS accuracy');
  if (speedKmh != null && (!Number.isFinite(speedKmh) || speedKmh < 0 || speedKmh > 250)) fail(400,'Invalid GPS speed');
  const observedAt = payload.observedAt ? new Date(payload.observedAt) : new Date();
  const drift = Date.now() - observedAt.getTime();
  if (!Number.isFinite(observedAt.getTime()) || drift < -20000 || drift > (source==='VEHICLE_GPS' ? 120000 : 60000)) fail(400,'GPS reading is too old or in the future');
  if (observedAt < new Date(ride.startedAt)) fail(400,'GPS point precedes trip start');
  const latest = await RideGpsSample.findOne({where:{rideId:ride.id,source},order:[['observedAt','DESC']]});
  if (latest && observedAt <= new Date(latest.observedAt)) return {accepted:false,reason:'duplicate-or-old-point'};
  if (latest && observedAt - new Date(latest.observedAt) < 5000) return {accepted:false,reason:'sample-too-frequent'};
  const record = await RideGpsSample.create({rideId:ride.id,driverId,vehicleId:ride.vehicleId||null,source,observedAt,lat:point.lat,lng:point.lng,accuracyM,speedKmh});
  return {accepted:true,id:record.id,observedAt};
}
export async function vehicleGpsIngest(req,res) {
  if (!tokenEqual(process.env.VEHICLE_GPS_INGEST_TOKEN,req.headers['x-periyar-gps-token'])) fail(401,'Invalid vehicle tracker credentials');
  const rideId = Number(req.body.rideId), vehicleId = Number(req.body.vehicleId);
  if (!Number.isSafeInteger(rideId) || !Number.isSafeInteger(vehicleId)) fail(400,'rideId and vehicleId required');
  const ride = await Ride.findByPk(rideId);
  if (!ride || ride.status !== 'IN_PROGRESS') fail(404,'Active trip not found');
  const isAssigned = ride.vehicleId === vehicleId || !!(await RideDriver.count({where:{rideId,vehicleId,status:'ASSIGNED'}}));
  if (!isAssigned) fail(403,'Vehicle not assigned to this ride');
  res.status(201).json(await addTripGpsSample(ride,req.body,'VEHICLE_GPS'));
}
