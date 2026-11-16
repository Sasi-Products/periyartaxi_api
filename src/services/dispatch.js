import _pkg_sequelize from "sequelize";
import { Ride, RideOffer, RideDriver, User, DriverProfile, DriverLocation, DriverShift, Assignment, Vehicle, RideEvent, sequelize } from "../models/index.js";
import { kmBetween } from "../utils/geo.js";
import { notify } from "./fcm.js";
import { emitRide } from "./socket.js";
import { fail } from "../utils/http.js";
const {Op} = _pkg_sequelize;

const ACTIVE=['ASSIGNED','ARRIVING','IN_PROGRESS'];
async function eligibleDrivers(ride){
 const now=new Date(),at=ride.scheduledAt&&ride.scheduledAt>now?ride.scheduledAt:now;
 const users=await User.findAll({where:{role:'DRIVER',branchId:ride.branchId,active:true}});
 const output=[];
 for(const u of users){
  const p=await DriverProfile.findOne({where:{userId:u.id,verification:'APPROVED',available:true}});if(!p)continue;
  const shift=await DriverShift.findOne({where:{driverId:u.id,active:true}});if(!shift)continue;
  const loc=await DriverLocation.findOne({where:{driverId:u.id}});
  if(!loc||Date.now()-new Date(loc.reportedAt).getTime()>Number(process.env.LOCATION_STALE_SECONDS||120)*1000)continue;
  const km=kmBetween({lat:loc.lat,lng:loc.lng},ride.pickup);if(km>Number(process.env.DISPATCH_RADIUS_KM||20))continue;
  const busy=await Ride.count({where:{assignedDriverId:u.id,status:{[Op.in]:ACTIVE}}});
  const engaged=await RideDriver.count({where:{driverId:u.id,status:'ASSIGNED',rideId:{[Op.ne]:ride.id}}});
  if(busy||engaged)continue;
  let vehicleId=null;
  if(!['DRIVER_RENT','VALET'].includes(ride.service)){
   const a=await Assignment.findOne({where:{driverId:u.id,active:true,startsAt:{[Op.lte]:at},endsAt:{[Op.gt]:at}}});if(!a)continue;
   const vehicle=await Vehicle.findByPk(a.vehicleId);if(!vehicle||!vehicle.active||vehicle.verification!=='APPROVED'||(vehicle.vehicleStatus&&vehicle.vehicleStatus!=='AVAILABLE')||vehicle.type!==ride.vehicleType)continue;
   const day=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
   if(['insuranceExpiry','pollutionExpiry','permitExpiry','fitnessExpiry'].some(field=>vehicle[field]&&vehicle[field]<day))continue;
   if(vehicle.ownershipType==='ATTACHED'&&vehicle.attachmentTerms?.endDate&&vehicle.attachmentTerms.endDate<day)continue;
   vehicleId=vehicle.id;
  }
  output.push({driverId:u.id,vehicleId,km});
 }
 return output.sort((a,b)=>a.km-b.km);
}
async function dispatch(rideId){
 const ride=await Ride.findByPk(rideId);if(!ride||!['REQUESTED','SEARCHING','OFFERED','NO_DRIVER','ASSIGNED'].includes(ride.status))return;
 if(ride.scheduledAt&&new Date(ride.scheduledAt)>new Date(Date.now()+15*60_000))return;
 const already=await RideDriver.count({where:{rideId,status:'ASSIGNED'}});
 if(already>=ride.requiredDrivers)return;
 const pending=await RideOffer.findOne({where:{rideId,status:'PENDING'}});if(pending&&pending.expiresAt>new Date())return;
 const used=(await RideOffer.findAll({where:{rideId}})).map(o=>o.driverId);
 let candidates=await eligibleDrivers(ride);candidates=candidates.filter(c=>!used.includes(c.driverId));
 if(!candidates.length){await ride.update({status:already?'ASSIGNED':'NO_DRIVER'});emitRide(ride);return}
 const target=candidates[0],offer=await RideOffer.create({rideId,driverId:target.driverId,vehicleId:target.vehicleId,expiresAt:new Date(Date.now()+Number(process.env.DISPATCH_OFFER_SECONDS||45)*1000)});
 await ride.update({status:'OFFERED'});
 await RideEvent.create({rideId,event:'OFFER_SENT',payload:{driverId:target.driverId,distanceKm:target.km}});
 await notify(target.driverId,'New Periyar Taxi trip',`${ride.service} • ${ride.pickupAddress||'Pickup location'}`,{rideId});emitRide(ride);
 return offer;
}
async function respond(rideId,userId,accept){
 const result=await sequelize.transaction(async t=>{
  const ride=await Ride.findByPk(rideId,{transaction:t,lock:t.LOCK.UPDATE});if(!ride||!['OFFERED','SEARCHING','ASSIGNED'].includes(ride.status))fail(409,'Trip is not accepting offers');
  const offer=await RideOffer.findOne({where:{rideId,driverId:userId,status:'PENDING'},transaction:t,lock:t.LOCK.UPDATE});
  if(!offer||offer.expiresAt<new Date())fail(409,'Offer is expired or unavailable');
  if(!accept){await offer.update({status:'REJECTED'},{transaction:t});return {ride,accepted:false}}
  const count=await RideDriver.count({where:{rideId,status:'ASSIGNED'},transaction:t});if(count>=ride.requiredDrivers)fail(409,'All requested drivers are already assigned');
  await offer.update({status:'ACCEPTED'},{transaction:t});await RideDriver.create({rideId,driverId:userId,vehicleId:offer.vehicleId},{transaction:t});
  await ride.update({assignedDriverId:ride.assignedDriverId||userId,vehicleId:ride.vehicleId||offer.vehicleId,status:'ASSIGNED'},{transaction:t});
  await RideEvent.create({rideId,actorId:userId,event:'DRIVER_ACCEPTED'},{transaction:t});return {ride,accepted:true};
 });
 emitRide(result.ride);if(result.accepted&&result.ride.requiredDrivers>1)await dispatch(rideId);if(!result.accepted)await dispatch(rideId);
 return result;
}
export { dispatch,respond,eligibleDrivers };
