import _pkg_sequelize from "sequelize";
import { RideWaitInterval } from "../models/index.js";
import { verifyAndConsumeOtp, passengerMobile, validateAttestation } from "../services/rideVerification.js";
import { Ride, RideEvent, RideCharge, RideOffer, RideDriver, User, DriverShift, Payment, CustomerProfile, sequelize } from "../models/index.js";
import { wrap, fail, positive, num, money } from "../utils/http.js";
import { buildQuote } from "../services/quote.js";
import { quoteFare } from "../services/fare.js";
import { dispatch, respond } from "../services/dispatch.js";
import { recalculate } from "../services/rideFinance.js";
import { emitRide } from "../services/socket.js";
import { notify } from "../services/fcm.js";
import { audit } from "../services/audit.js";
import { branchGuard, hasPermission } from "../middleware/auth.js";
import { mobile as checkMobile } from "../utils/validate.js";
import { scopedCustomer, findCustomerByPhone, sameMobile } from "../services/customerAccess.js";
import { Vehicle,DriverProfile } from '../models/index.js';
import { eligibleDrivers } from '../services/dispatch.js';
const {Op} = _pkg_sequelize;




const statuses={arrive:['ASSIGNED'],start:['ASSIGNED','ARRIVING'],finish:['IN_PROGRESS'],cancel:['REQUESTED','SEARCHING','OFFERED','ASSIGNED','ARRIVING']};
async function assertRead(req,ride){if(!ride)fail(404,'Trip not found');if(req.user.role==='CUSTOMER'&&ride.customerId!==req.user.id)fail(403,'Not your trip');if(req.user.role==='DRIVER'&&!await RideDriver.count({where:{rideId:ride.id,driverId:req.user.id}})&&ride.assignedDriverId!==req.user.id)fail(403,'Not assigned to your trip');if(req.user.role==='ADMIN')branchGuard(req,ride.branchId)}
async function isAssigned(ride,user){return user.role==='DRIVER'&&(ride.assignedDriverId===user.id||await RideDriver.count({where:{rideId:ride.id,driverId:user.id,status:'ASSIGNED'}})>0)}
async function changeEvent(req,ride,event,message=''){await RideEvent.create({rideId:ride.id,actorId:req.user.id,event,message});emitRide(ride)}
export const quote =wrap(async(req,res)=>{const result=await buildQuote(req,req.body);res.json({branchId:result.branchId,distanceKm:result.route.distanceKm,durationMinutes:result.route.durationMinutes,estimate:result.estimate,overviewPolyline:result.route.overviewPolyline})});
export const create = wrap(async (req, res) => {
  const operator = ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role);
  const service = req.body.service;
  const branchId = positive(req.body.branchId, 'branch ID');
  if (req.user.role === 'DRIVER') fail(403, 'Drivers cannot book rides');
  if (req.user.role === 'CUSTOMER' && req.body.forceManualRoute) fail(403, 'Distance cannot be overridden');
  if (operator) branchGuard(req, branchId);

  // Prices are calculated first. Do not create customers or trips if quoting fails.
  const result = await buildQuote(req, req.body);
  const scheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt) : new Date();
  if (!Number.isFinite(scheduledAt.getTime()) || scheduledAt < Date.now() - 60000 || scheduledAt > new Date(Date.now() + 180 * 86400000)) fail(400, 'Scheduled time must be within 180 days');
  const requiredDrivers = service === 'VALET' ? num(req.body.requiredDrivers, 'required drivers', 1) : 1;
  const guestName = String(req.body.guestName || '').trim().slice(0, 140);
  const guestMobile = String(req.body.guestMobile || '').trim() ? checkMobile(req.body.guestMobile) : null;
  if (req.body.passengerNoPhone === true && guestMobile) fail(400,'Remove passenger mobile number when selecting passenger has no phone');
  if (req.body.bookingFor === 'OTHERS' && !guestMobile && req.body.passengerNoPhone !== true) fail(400,'For another passenger, enter their phone or explicitly select passenger has no phone');
  let linkedCustomer = null;
  if (operator && req.body.customerId) {
    try {
      const info = await scopedCustomer(req, req.body.customerId);
      linkedCustomer = info.user;
    } catch (error) {
      // A branch can accept an app user from another branch only when the
      // passenger presents the exact registered mobile number.
      if (error.status !== 404 || !guestMobile || req.user.role !== 'ADMIN' || !hasPermission(req.user,'customers.view')) throw error;
      const external = await User.findByPk(positive(req.body.customerId, 'customer ID'));
      if (!external || external.role !== 'CUSTOMER' || !sameMobile(external.mobile, guestMobile)) throw error;
      linkedCustomer = external;
    }
    if (!linkedCustomer.active) fail(409, 'Customer account is inactive');
  }
  if (operator && !linkedCustomer && guestName.length < 2) fail(400, 'Enter the walk-in customer name or select an existing customer');
  if (operator && !linkedCustomer && guestMobile && await findCustomerByPhone(guestMobile)) fail(409, 'This mobile belongs to an existing account. Select the existing customer before booking to prevent duplicates.');

  const data = {
    branchId,
    customerId: operator ? linkedCustomer?.id || null : req.user.id,
    guestName: guestName || linkedCustomer?.name || null,
    guestMobile: guestMobile || linkedCustomer?.mobile || null,
    service: result.estimate.service,
    tripMode: req.body.tripMode || 'ONE_WAY',
    packageId: req.body.packageId || null,
    vehicleType: service==='DRIVER_RENT'?req.body.customerVehicle?.category:(req.body.vehicleType || null),
    customerVehicle: service==='DRIVER_RENT'?{
      category:String(req.body.customerVehicle?.category||''),
      brand:String(req.body.customerVehicle?.brand||'').trim().slice(0,90),
      model:String(req.body.customerVehicle?.model||'').trim().slice(0,90),
      registration:String(req.body.customerVehicle?.registration||'').trim().slice(0,30),
      notes:String(req.body.customerVehicle?.notes||'').trim().slice(0,500),
    }:null,
    requiredDrivers,
    pickup: req.body.pickup,
    dropoff: req.body.dropoff || null,
    pickupAddress: String(req.body.pickupAddress || '').slice(0, 1000),
    dropoffAddress: String(req.body.dropoffAddress || '').slice(0, 1000),
    distanceKm: result.route.distanceKm,
    durationMinutes: result.route.durationMinutes,
    scheduledAt,
    returnAt: req.body.returnAt || null,
    status: 'REQUESTED',
    quote: { estimate: result.estimate, originalService: service, pricingVersionDate: new Date().toISOString() },
    estimatedFare: result.estimate.total,
    startOtpHash: null,
    createdBy: req.user.id,
    notes: req.body.notes || null,
    metadata: { bookingChannel: operator ? req.user.role : 'APP', passengerNoPhone: (operator || req.body.bookingFor === 'OTHERS') && req.body.passengerNoPhone === true, bookedForOthers: req.body.bookingFor === 'OTHERS' }
  };
  if (['LOCAL', 'LOCAL_PACKAGE', 'OUTSTATION'].includes(service) && !data.vehicleType) fail(400, 'Vehicle category required');
  const ride = await sequelize.transaction(async transaction => {
    if (operator && !linkedCustomer) {
      // Walk-in booking without a phone is supported. It gets a reusable customer ID
      // and can be chosen by an operator for the customer's next visit.
      const newCustomer = await User.create({ name: guestName, mobile: guestMobile, role: 'CUSTOMER', branchId: null, active: true }, { transaction });
      await CustomerProfile.create({ userId: newCustomer.id, branchId, createdVia: req.user.role, createdBy: req.user.id }, { transaction });
      data.customerId = newCustomer.id;
    }
    const record = await Ride.create(data, { transaction });
    return record;
  });
  await changeEvent(req, ride, 'BOOKING_CREATED');
  if (operator) await audit(req, req.body.forceManualRoute ? 'TRIP_CREATED_MANUAL_ROUTE' : 'TRIP_CREATED', 'Ride', ride.id, null, { customerId: ride.customerId, estimatedFare: ride.estimatedFare });
  if (scheduledAt.getTime() <= Date.now() + 15 * 60000) dispatch(ride.id).catch(error => console.error('Dispatch failed:', error));
  res.status(201).json({ ride });
});
export const list =wrap(async(req,res)=>{let where={};const u=req.user;if(u.role==='CUSTOMER')where.customerId=u.id;
 if(u.role==='ADMIN')where.branchId=u.branchId;
 if(u.role==='DRIVER'){const ids=(await RideDriver.findAll({where:{driverId:u.id},attributes:['rideId']})).map(x=>x.rideId);where.id={[Op.in]:ids}}
 if(req.query.status)where.status=req.query.status;if(req.query.service)where.service=req.query.service;
 if(req.query.branchId&&u.role==='SUPER_ADMIN')where.branchId=positive(req.query.branchId);
 let rows=await Ride.findAll({where,order:[['id','DESC']],limit:300});res.json(rows.map(r=>{const j=r.toJSON();delete j.startOtpHash;return j}))});
export const one =wrap(async(req,res)=>{const ride=await Ride.findByPk(positive(req.params.id));await assertRead(req,ride);let data=ride.toJSON();delete data.startOtpHash;const charges=await RideCharge.findAll({where:{rideId:ride.id}}),events=await RideEvent.findAll({where:{rideId:ride.id},order:[['id','DESC']],limit:100}),payments=await Payment.findAll({where:{rideId:ride.id}});const d=ride.assignedDriverId?await User.findByPk(ride.assignedDriverId):null;const v=ride.vehicleId?await Vehicle.findByPk(ride.vehicleId):null;const customer=ride.customerId?await User.findByPk(ride.customerId):null;res.json({...data,customer:customer?{id:customer.id,name:customer.name,mobile:customer.mobile}:null,driver:d?{name:d.name,mobile:d.mobile}:null,vehicle:v?{registration:v.registration,brand:v.brand,name:v.name,variant:v.variant,type:v.type}:null,charges,events,payments})});
export const offers =wrap(async(req,res)=>{res.json(await RideOffer.findAll({where:{driverId:req.user.id,status:'PENDING',expiresAt:{[Op.gt]:new Date()}},order:[['id','DESC']],limit:50}))});
export const offerResponse =wrap(async(req,res)=>{const result=await respond(positive(req.params.id),req.user.id,!!req.body.accept);res.json({accepted:result.accepted,ride:result.ride})});
export const manualAssign =wrap(async(req,res)=>{const ride=await Ride.findByPk(positive(req.params.id));if(!ride)fail(404,'Trip not found');branchGuard(req,ride.branchId);if(!['REQUESTED','SEARCHING','OFFERED','NO_DRIVER','ASSIGNED'].includes(ride.status))fail(409,'Cannot assign this trip');const d=await User.findByPk(positive(req.body.driverId));if(!d||d.role!=='DRIVER'||d.branchId!==ride.branchId)fail(422,'Driver not in this branch');
 if(ride.service==='DRIVER_RENT'){const profile=await DriverProfile.findOne({where:{userId:d.id}});if(!profile||profile.kind!=='ACTING'||!profile.adminEnabled)fail(422,'Driver for Rent requires an active acting driver');if(ride.customerVehicle?.category&&Array.isArray(profile.rentCapabilities)&&profile.rentCapabilities.length&&!profile.rentCapabilities.includes(ride.customerVehicle.category))fail(422,'Acting driver cannot handle this customer vehicle class');}
 const available=(await eligibleDrivers(ride)).find(x=>x.driverId===d.id);if(!available)fail(422,'Driver is not eligible, on shift, verified, or available');
 if(await RideDriver.count({where:{rideId:ride.id,driverId:d.id,status:'ASSIGNED'}}))fail(409,'Already assigned');
 if(await RideDriver.count({where:{rideId:ride.id,status:'ASSIGNED'}})>=ride.requiredDrivers)fail(409,'All required drivers assigned');
 await RideOffer.update({status:'EXPIRED'},{where:{rideId:ride.id,status:'PENDING'}});
 await RideDriver.create({rideId:ride.id,driverId:d.id,vehicleId:available.vehicleId});await ride.update({assignedDriverId:ride.assignedDriverId||d.id,vehicleId:ride.vehicleId||available.vehicleId,status:'ASSIGNED'});
 await changeEvent(req,ride,'MANUAL_ASSIGNMENT');await audit(req,'TRIP_MANUAL_ASSIGN','Ride',ride.id,null,{driverId:d.id});await notify(d.id,'Trip assigned',`Pickup: ${ride.pickupAddress||'See trip details'}`,{rideId:ride.id});res.json(ride)});
export const arrive =wrap(async(req,res)=>{let ride=await Ride.findByPk(positive(req.params.id));await assertRead(req,ride);if(!await isAssigned(ride,req.user)&&!['ADMIN','SUPER_ADMIN'].includes(req.user.role))fail(403,'Only assigned driver can arrive');if(!statuses.arrive.includes(ride.status))fail(409,'Invalid trip status');await ride.update({status:'ARRIVING'});await changeEvent(req,ride,'DRIVER_ARRIVING');res.json(ride)});
// START and END have distinct random, short-lived, one-use passenger OTPs.
// No-phone fallbacks require in-person attestation and are recorded against the actor.
async function lifecycleVerification(req, ride, stage, transaction) {
  const customer=ride.customerId?await User.findByPk(ride.customerId,{transaction}):null;
  const contact=passengerMobile(ride,customer);
  const admin=['SUPER_ADMIN','ADMIN'].includes(req.user.role);
  const body=req.body||{};
  if(body.adminOverride===true && !admin)fail(403,'Only an authorized operator may bypass a reachable passenger OTP');
  const bypass=validateAttestation({ride,payload:body,customerPhone:contact});
  if(bypass)return { method:bypass.type,reason:bypass.reason };
  const correct=await verifyAndConsumeOtp(ride.id,stage,body.otp,transaction);
  return correct?{method:'PASSENGER_OTP'}:{method:'INVALID_OTP'};
}
export const start=wrap(async(req,res)=>{
  const ride=await Ride.findByPk(positive(req.params.id));await assertRead(req,ride);
  if(!await isAssigned(ride,req.user)&&!['ADMIN','SUPER_ADMIN'].includes(req.user.role))fail(403,'Only assigned driver/operator can start');
  let verification;
  await sequelize.transaction(async transaction=>{
    const locked=await Ride.findByPk(ride.id,{transaction,lock:transaction.LOCK.UPDATE});
    if(!statuses.start.includes(locked.status))fail(409,'Trip is not ready to start');
    verification=await lifecycleVerification(req,locked,'START',transaction);
    if(verification.method==='INVALID_OTP')return; // commit failed-attempt count
    await locked.update({status:'IN_PROGRESS',startedAt:new Date()},{transaction});
    await RideEvent.create({rideId:locked.id,actorId:req.user.id,event:'TRIP_STARTED',payload:{verification}},{transaction});
  });
  if(verification.method==='INVALID_OTP')fail(403,'Incorrect OTP');
  await ride.reload();
  await audit(req,'TRIP_START_'+verification.method,'Ride',ride.id,null,{reason:verification.reason||null});
  emitRide(ride);
  res.json(ride);
});
export const finish=wrap(async(req,res)=>{
  const ride=await Ride.findByPk(positive(req.params.id));await assertRead(req,ride);
  if(!await isAssigned(ride,req.user)&&!['ADMIN','SUPER_ADMIN'].includes(req.user.role))fail(403,'Only assigned driver/operator can end');
  let verification;
  await sequelize.transaction(async transaction=>{
    const locked=await Ride.findByPk(ride.id,{transaction,lock:transaction.LOCK.UPDATE});
    if(locked.status!=='IN_PROGRESS')fail(409,'Trip not in progress');
    verification=await lifecycleVerification(req,locked,'END',transaction);
    if(verification.method==='INVALID_OTP')return;
    const endedAt=new Date();
    const metadata=typeof locked.metadata==='string'?JSON.parse(locked.metadata||'{}'):{...(locked.metadata||{})};
    if(req.body.actualKm!==undefined || req.body.odometerStartKm!==undefined || req.body.odometerEndKm!==undefined){
      if(!['ADMIN','SUPER_ADMIN'].includes(req.user.role))fail(403,'Only an operator can approve manually entered distance');
      const reason=String(req.body.manualReason||'').trim();if(reason.length<12)fail(400,'Enter an audit reason for manual odometer/distance');
      if(req.body.odometerStartKm!==undefined || req.body.odometerEndKm!==undefined){
        const begin=num(req.body.odometerStartKm,'starting odometer'),end=num(req.body.odometerEndKm,'ending odometer');
        if(end<begin||end-begin>5000)fail(400,'Invalid odometer readings');
        metadata.verifiedDistanceKm=end-begin;
        metadata.odometerStartKm=begin;metadata.odometerEndKm=end;
      }else metadata.verifiedDistanceKm=num(req.body.actualKm,'actual distance');
      metadata.distanceApprovedBy=req.user.id;
      metadata.manualDistanceReason=reason;
    }
    await locked.update({status:'COMPLETED',endedAt,metadata},{transaction});
    await RideWaitInterval.update({endedAt},{where:{rideId:locked.id,endedAt:null,status:'PENDING'},transaction});
    await RideEvent.create({rideId:locked.id,actorId:req.user.id,event:'TRIP_COMPLETED',payload:{verification,manualDistance:metadata.verifiedDistanceKm??null}},{transaction});
  });
  if(verification.method==='INVALID_OTP')fail(403,'Incorrect OTP');
  await ride.reload();
  const result=await recalculate(ride);
  await RideDriver.update({status:'COMPLETED'},{where:{rideId:ride.id,status:'ASSIGNED'}});
  await audit(req,'TRIP_FINISHED_'+verification.method,'Ride',ride.id,null,{finalFare:ride.finalFare,distanceSource:result.timing?.distanceSource,reason:verification.reason||null});
  emitRide(ride);
  res.json(ride);
});
export const cancel =wrap(async(req,res)=>{const ride=await Ride.findByPk(positive(req.params.id));await assertRead(req,ride);if(!statuses.cancel.includes(ride.status))fail(409,'Trip cannot be cancelled now');if(req.user.role==='DRIVER')fail(403,'Drivers should reject the offer or contact dispatch');
 await ride.update({status:'CANCELLED',cancelledAt:new Date(),cancelReason:String(req.body.reason||'Cancelled').slice(0,500)});await RideOffer.update({status:'EXPIRED'},{where:{rideId:ride.id,status:'PENDING'}});await RideDriver.update({status:'REMOVED'},{where:{rideId:ride.id,status:'ASSIGNED'}});
 await changeEvent(req,ride,'TRIP_CANCELLED',ride.cancelReason);res.json(ride)});
export const charges =wrap(async(req,res)=>{const ride=await Ride.findByPk(positive(req.params.id));await assertRead(req,ride);if(!await isAssigned(ride,req.user)&&!['ADMIN','SUPER_ADMIN'].includes(req.user.role))fail(403,'Not assigned');if(!['IN_PROGRESS','COMPLETED'].includes(ride.status))fail(409,'Charges only during or after trips');
 const type=req.body.type;if(!['DRIVER_BETA','TOLL','PARKING','FOOD','HILL','WAITING','EXTRA_KM','OTHER'].includes(type))fail(400,'Invalid charge type');const amount=num(req.body.amount,'charge amount');if(amount>100000)fail(400,'Charge too large');
 if(type==='WAITING'&&ride.service==='LOCAL'&&Number(ride.quote?.estimate?.pricingSnapshot?.waitingPerMinute)>0)fail(409,'Local waiting is calculated from approved waiting intervals; do not add a second waiting charge');
 const approved=['ADMIN','SUPER_ADMIN'].includes(req.user.role);const charge=await RideCharge.create({rideId:ride.id,type,amount,note:String(req.body.note||'').slice(0,1000),createdBy:req.user.id,status:approved?'APPROVED':'PENDING',approvedBy:approved?req.user.id:null});if(approved&&ride.status==='COMPLETED')await recalculate(ride);await audit(req,'CHARGE_ADDED','RideCharge',charge.id,null,{type,amount,status:charge.status});res.status(201).json(charge)});
export const approveCharge =wrap(async(req,res)=>{const charge=await RideCharge.findByPk(positive(req.params.chargeId));if(!charge)fail(404,'Charge missing');const ride=await Ride.findByPk(charge.rideId);branchGuard(req,ride.branchId);await charge.update({status:req.body.approve?'APPROVED':'REJECTED',approvedBy:req.user.id});if(ride.status==='COMPLETED')await recalculate(ride);await audit(req,'CHARGE_REVIEW','RideCharge',charge.id);res.json(charge)});
export const redispatch =wrap(async(req,res)=>{const ride=await Ride.findByPk(positive(req.params.id));if(!ride)fail(404,'Trip missing');branchGuard(req,ride.branchId);await dispatch(ride.id);res.json(await Ride.findByPk(ride.id))});
