import { RideGpsSample, RideWaitInterval } from '../models/index.js';
import { summarizeSamples, calculateWaits } from './tripTimingMath.js';
export { haversineKm, summarizeSamples, calculateWaits } from './tripTimingMath.js';
export async function tripTiming(ride, at = ride.endedAt || new Date()) {
  if (!ride.startedAt) return { started: false, elapsedSeconds: 0, gpsCoverage: 0, sampleCount: 0, approvedWaitingSeconds: 0, pendingWaitingSeconds: 0 };
  const [samples, waits] = await Promise.all([
    RideGpsSample.findAll({where:{rideId:ride.id},order:[['observedAt','ASC']],limit:25000}),
    RideWaitInterval.findAll({where:{rideId:ride.id},order:[['startedAt','ASC']]}),
  ]);
  const vehicleSamples=samples.filter(s=>s.source==='VEHICLE_GPS');
  const phoneSamples=samples.filter(s=>s.source==='DRIVER_PHONE');
  const deviceMetrics=summarizeSamples(vehicleSamples,ride.startedAt,at);
  const phoneMetrics=summarizeSamples(phoneSamples,ride.startedAt,at);
  const measurements=(deviceMetrics.gpsCoverage>=0.70 || deviceMetrics.gpsCoverage>=phoneMetrics.gpsCoverage && deviceMetrics.sampleCount>=3)
    ? deviceMetrics : phoneMetrics;
  measurements.primaryGpsSource = measurements===deviceMetrics ? 'VEHICLE_GPS' : 'DRIVER_PHONE';
  measurements.availableGpsSources = [...new Set(samples.map(s=>s.source))];
  const waiting = calculateWaits(waits, ride.startedAt, at);
  return {
    started: true, ...measurements, ...waiting,
    runningSeconds: Math.max(0, measurements.elapsedSeconds - waiting.approvedWaitingSeconds),
    // GPS stationary time is descriptive, never independently chargeable.
    waitingBasis: 'APPROVED_EXPLICIT_STOPS',
  };
}
export function resolveDistance(ride, timing, metadata = {}) {
  if(['DRIVER_RENT','VALET'].includes(ride.service))return { distanceKm:0, distanceSource:'NOT_APPLICABLE', provisional:false };
  const manual = metadata.verifiedDistanceKm ?? metadata.actualKm;
  if (Number.isFinite(Number(manual)) && manual !== null && manual !== undefined && Number(manual) >= 0 && metadata.distanceApprovedBy) {
    return { distanceKm: Number(manual), distanceSource: 'OPERATOR_ODOMETER', provisional: false };
  }
  // Do not publish an incomplete GPS trail as precise distance.
  if (timing.gpsCoverage >= 0.90 && timing.sampleCount >= 3 && timing.gpsDistanceKm > 0) {
    return { distanceKm: timing.gpsDistanceKm, distanceSource: 'GPS_MEASURED', provisional: false };
  }
  return { distanceKm: Number(ride.distanceKm || 0), distanceSource: 'ROUTE_ESTIMATE', provisional: true };
}
