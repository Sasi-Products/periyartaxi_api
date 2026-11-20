import test from 'node:test';
import assert from 'node:assert/strict';
import {quoteFare,validateConfig} from '../src/services/fare.js';
import {payPeriod,inPeriod} from '../src/utils/payPeriod.js';
import {VEHICLE_CATEGORIES} from '../src/utils/vehicleCategories.js';

test('new mini bus/coach/urbania categories exist',()=>{
 for(const category of ['TEMPO_TRAVELLER','COACH_VAN','MINI_BUS','BUS','URBANIA'])assert.ok(VEHICLE_CATEGORIES.includes(category));
});
test('outstation below threshold uses short km and hour prices',()=>{
 const r=quoteFare({service:'OUTSTATION',distanceKm:80,hours:4,config:{shortPerKm:17,longPerKm:20,shortExtraHour:100,longExtraHour:125}});
 assert.equal(r.total,450+(80-30)*17+100);
});
test('long outstation has no minimum fare and independent prices',()=>{
 const r=quoteFare({service:'OUTSTATION',distanceKm:120,hours:6,config:{longPerKm:18,longExtraHour:120}});
 assert.equal(r.total,120*18+120);
});
test('old outstation perKm/extraHour config remains supported',()=>{
 const r=quoteFare({service:'OUTSTATION',distanceKm:120,hours:6,config:{perKm:20,extraHour:90}});
 assert.equal(r.total,120*20+90);
});
test('driver rent independent base and hourly values',()=>{
 const q=quoteFare({service:'DRIVER_RENT',hours:8,config:{minimumFare:1100,minimumHours:6,extraHour:125}});
 assert.equal(q.total,1350);
});
test('ISO weekly payroll periods and date filtering',()=>{
 const w=payPeriod('2026-W47');assert.equal(w.kind,'WEEK');assert.equal(w.start.toISOString().slice(0,10),'2026-11-16');
 assert.ok(inPeriod('2026-11-20',w));assert.ok(!inPeriod('2026-11-23',w));
});
test('invalid payroll periods rejected',()=>{
 assert.throws(()=>payPeriod('2026-W00'));assert.throws(()=>payPeriod('2026-13'));
});
