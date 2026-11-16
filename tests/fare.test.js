import test from "node:test";
import assert from "node:assert/strict";
import { quoteFare } from "../src/services/fare.js";

test('local 8km gives 205; with 70 boundary becomes 275',()=>{let q=quoteFare({service:'LOCAL',distanceKm:8});assert.equal(q.total,205);});
test('2h local package overrun 3hrs 30km gives 720',()=>{let q=quoteFare({service:'LOCAL_PACKAGE',distanceKm:30,hours:3,packageData:{baseFare:420,kms:20,hours:2,extraHour:90,extraKm:21}});assert.equal(q.total,720);});
test('outstation 120km costs 1560 before surcharges',()=>{let q=quoteFare({service:'OUTSTATION',distanceKm:120,hours:5});assert.equal(q.total,1560);});
test('driver rent 8 hours costs 810',()=>{let q=quoteFare({service:'DRIVER_RENT',hours:8});assert.equal(q.total,810);});
test('local boundary grace fee yields ₹275 for eight kilometres',()=>{
 const polygon=[{lat:11,lng:77},{lat:11.01,lng:77},{lat:11.01,lng:77.01},{lat:11,lng:77.01}];
 const routePoints=[{lat:11.005,lng:77.005},{lat:11.005,lng:77.015}];
 const fare=quoteFare({service:'LOCAL',distanceKm:8,routePoints,polygon});
 assert.equal(fare.components.boundaryCharge,70);assert.equal(fare.total,275);
});
test('boundary limit converts local to outstation',()=>{
 const polygon=[{lat:11,lng:77},{lat:11.01,lng:77},{lat:11.01,lng:77.01},{lat:11,lng:77.01}];
 const q=quoteFare({service:'LOCAL',distanceKm:11,routePoints:[{lat:11.005,lng:77.005},{lat:11.005,lng:77.055}],polygon,outstationConfig:{minFare:450}});
 assert.equal(q.service,'OUTSTATION');assert.equal(q.convertedFrom,'LOCAL');assert.equal(q.total,450);
});
test('valet pricing must be explicitly configured',()=>{
 assert.throws(()=>quoteFare({service:'VALET',requiredDrivers:2,hours:4}),/Configure valet pricing/);
 const q=quoteFare({service:'VALET',requiredDrivers:2,hours:5,config:{minimumHours:4,perDriverBaseFare:500,extraHourPerDriver:100}});
 assert.equal(q.total,1200);
});
