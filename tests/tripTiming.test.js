import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeSamples, calculateWaits, localWaitingFare } from '../src/services/tripTimingMath.js';

const startedAt = new Date('2026-11-16T02:00:00.000Z');
const at = offset => new Date(startedAt.getTime()+offset*1000);
const sample = (s,lat,lng,speedKmh=0) => ({observedAt:at(s),lat,lng,speedKmh,accuracyM:10,source:'DRIVER_PHONE'});

test('stationary GPS records are not implicitly billable waiting',()=>{
  const result=summarizeSamples([sample(0,11.34,77.71),sample(30,11.34,77.71),sample(60,11.34,77.71)],startedAt,at(60));
  assert.equal(result.gpsStationarySeconds,60);
  assert.equal(result.gpsMovingSeconds,0);
  assert.equal(calculateWaits([],startedAt,at(60)).approvedWaitingSeconds,0);
});
test('GPS gaps stay unknown and do not become billable waits',()=>{
  const result=summarizeSamples([sample(0,11.34,77.71),sample(10,11.34,77.71),sample(400,11.34,77.71)],startedAt,at(400));
  assert.equal(result.gpsStationarySeconds,10);
  assert.equal(result.unobservedSeconds,390);
});
test('approved waits are separated from pending intervals',()=>{
  const waits=[
    {startedAt:at(20),endedAt:at(80),status:'APPROVED'},
    {startedAt:at(100),endedAt:at(125),status:'PENDING'},
  ];
  assert.deepEqual(calculateWaits(waits,startedAt,at(180)),{approvedWaitingSeconds:60,pendingWaitingSeconds:25});
});
test('plausible displacement produces GPS distance and moving time',()=>{
  const result=summarizeSamples([sample(0,11.34,77.71,null),sample(30,11.3405,77.71,null),sample(60,11.341,77.71,null)],startedAt,at(60));
  assert.equal(result.gpsMovingSeconds,60);
  assert.ok(result.gpsDistanceKm>0.10);
});

test('local waiting charged only after grace and only at configured rate',()=>{
  assert.equal(localWaitingFare(10*60,2,2),16);
  assert.equal(localWaitingFare(10*60,2,0),0);
  assert.equal(localWaitingFare(60,2,2),0);
});
