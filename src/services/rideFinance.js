import { RideCharge, Payment } from '../models/index.js';
import { quoteFare } from './fare.js';
import { money } from '../utils/http.js';
import { tripTiming, resolveDistance } from './rideTiming.js';
import { localWaitingFare } from './tripTimingMath.js';

const object = v => { if (typeof v === 'string') { try { v=JSON.parse(v); } catch { return {}; } } return v && typeof v==='object' && !Array.isArray(v) ? v : {}; };
export async function recalculate(ride) {
  const snapshot = object(ride.quote), estimate = object(snapshot.estimate);
  const metadata = object(ride.metadata);
  let baseFare = Number(estimate.total || ride.estimatedFare || 0);
  let timing=null, distance=null, waitingFare=0;
  if (ride.startedAt && ride.endedAt) {
    timing = await tripTiming(ride);
    distance = resolveDistance(ride,timing,metadata);
    // All hourly products use total trip elapsed time, not elapsed time minus waits.
    // Local trips may also add a separately configured per-minute charge for approved
    // passenger-requested waiting; GPS stationary periods are never billable by themselves.
    const cfg = object(estimate.pricingSnapshot);
    // Round-trip quotes multiply the one-way planned route. Real GPS/odometer
    // readings already cover the whole actual journey, so never multiply twice.
    const roundFactor = ride.service==='OUTSTATION' && ride.tripMode==='ROUND_TRIP'
      ? Number(cfg.roundTripDistanceMultiplier || 2) : 1;
    const quoteDistance = roundFactor>0 && distance.distanceSource!=='ROUTE_ESTIMATE'
      ? distance.distanceKm / roundFactor : distance.distanceKm;
    const f = quoteFare({
      service: ride.service,
      distanceKm: quoteDistance,
      hours: timing.elapsedSeconds/3600,
      tripMode:ride.tripMode,
      requiredDrivers:ride.requiredDrivers,
      packageData:estimate.packageSnapshot,
      config:cfg,
    });
    const preservedBoundary=Number(estimate.components?.boundaryCharge||0);
    baseFare=money(f.total+preservedBoundary);
    if (ride.service==='LOCAL' && Number(cfg.waitingPerMinute)>0) {
      waitingFare=localWaitingFare(timing.approvedWaitingSeconds,cfg.waitingGraceMinutes,cfg.waitingPerMinute);
    }
  }
  const extras = await RideCharge.findAll({where:{rideId:ride.id,status:'APPROVED'}});
  const extraTotal = extras.reduce((s,c)=>s+Number(c.amount||0),0);
  const total=money(baseFare+waitingFare+extraTotal);
  const payments=await Payment.findAll({where:{rideId:ride.id,status:'SUCCESS'}});
  const paid=money(payments.reduce((s,p)=>s+Number(p.amount||0),0));
  const newMetadata={...metadata,timing:timing?{
    ...timing,
    ...distance,
    baseFare,waitingFare,approvedExtras:money(extraTotal),
    calculatedAt:new Date().toISOString(),
  }:metadata.timing};
  await ride.update({finalFare:total,metadata:newMetadata,paymentStatus:paid>=total&&total>0?'PAID':paid>0?'PARTIAL':'UNPAID'});
  return {total,paid,outstanding:money(Math.max(0,total-paid)),timing:newMetadata.timing};
}
