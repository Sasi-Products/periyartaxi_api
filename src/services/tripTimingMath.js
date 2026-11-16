import { money } from '../utils/http.js';
// Conservative classification: we never turn a traffic light or congestion into billable waiting.
const MAX_GAP_SECONDS = 120;
const GOOD_ACCURACY_METRES = 65;
const MOVING_SPEED_KMH = 4;
const MAX_PLAUSIBLE_KMH = 150;
export const haversineKm = (a, b) => {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r;
  const dLng = (b.lng - a.lng) * r;
  const t = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(t), Math.sqrt(Math.max(0, 1 - t)));
};
const secondsBetween = (a, b) => Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 1000);

export function summarizeSamples(rawSamples, startedAt, endedAt = new Date()) {
  const start = new Date(startedAt).getTime(), end = new Date(endedAt).getTime();
  const elapsedSeconds = Math.max(0, (end - start) / 1000);
  const samples = rawSamples.map(s => ({
    lat: Number(s.lat), lng: Number(s.lng), speedKmh: s.speedKmh == null ? null : Number(s.speedKmh),
    accuracyM: s.accuracyM == null ? null : Number(s.accuracyM), observedAt: new Date(s.observedAt), source: s.source,
  })).filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lng) && Number.isFinite(s.observedAt.getTime()) && s.observedAt.getTime() >= start && s.observedAt.getTime() <= end)
    .sort((a,b) => a.observedAt-b.observedAt);
  let movingSeconds = 0, stationarySeconds = 0, gpsDistanceKm = 0;
  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i-1], next = samples[i];
    const dt = secondsBetween(prev.observedAt, next.observedAt);
    if (dt < 2 || dt > MAX_GAP_SECONDS) continue;
    if ((prev.accuracyM != null && prev.accuracyM > GOOD_ACCURACY_METRES) || (next.accuracyM != null && next.accuracyM > GOOD_ACCURACY_METRES)) continue;
    const km = haversineKm(prev, next);
    const inferredSpeed = km / dt * 3600;
    if (!Number.isFinite(inferredSpeed) || inferredSpeed > MAX_PLAUSIBLE_KMH) continue;
    gpsDistanceKm += km;
    const speed = next.speedKmh != null && next.speedKmh >= 0 && next.speedKmh <= MAX_PLAUSIBLE_KMH ? Math.max(inferredSpeed, next.speedKmh) : inferredSpeed;
    if (speed >= MOVING_SPEED_KMH) movingSeconds += dt;
    else stationarySeconds += dt;
  }
  const coveredSeconds = Math.min(elapsedSeconds, movingSeconds + stationarySeconds);
  return {
    elapsedSeconds: Math.round(elapsedSeconds),
    gpsMovingSeconds: Math.round(movingSeconds),
    gpsStationarySeconds: Math.round(stationarySeconds),
    unobservedSeconds: Math.round(Math.max(0, elapsedSeconds - coveredSeconds)),
    gpsCoverage: elapsedSeconds ? money(coveredSeconds / elapsedSeconds) : 0,
    gpsDistanceKm: money(gpsDistanceKm),
    sampleCount: samples.length,
    locationSources: [...new Set(samples.map(s => s.source))],
  };
}
export function calculateWaits(waits, startedAt, endedAt = new Date()) {
  const first = new Date(startedAt).getTime(), last = new Date(endedAt).getTime();
  const sum = status => waits.filter(w => w.status === status).reduce((total, w) => {
    const from = Math.max(first, new Date(w.startedAt).getTime());
    const to = Math.min(last, new Date(w.endedAt || endedAt).getTime());
    return total + Math.max(0, (to - from) / 1000);
  }, 0);
  return { approvedWaitingSeconds: Math.round(sum('APPROVED')), pendingWaitingSeconds: Math.round(sum('PENDING')) };
}
export function localWaitingFare(approvedSeconds, graceMinutes, rupeesPerMinute) {
  const seconds=Math.max(0,Number(approvedSeconds)||0);
  const grace=Math.max(0,Number(graceMinutes)||0);
  const rate=Math.max(0,Number(rupeesPerMinute)||0);
  return money(Math.max(0,seconds/60-grace)*rate);
}
