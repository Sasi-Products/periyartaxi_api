import crypto from "crypto";
import Razorpay from "razorpay";
import { Ride, Payment, sequelize } from "../models/index.js";
import { wrap, fail, positive, num, money } from "../utils/http.js";
import { recalculate } from "../services/rideFinance.js";
import { branchGuard } from "../middleware/auth.js";
import { audit } from "../services/audit.js";

const getGateway=()=>{if(!process.env.RAZORPAY_KEY_ID||!process.env.RAZORPAY_KEY_SECRET)fail(503,'Razorpay is not configured');return new Razorpay({key_id:process.env.RAZORPAY_KEY_ID,key_secret:process.env.RAZORPAY_KEY_SECRET})};
async function allowRide(req,ride){if(!ride)fail(404,'Trip missing');if(req.user.role==='CUSTOMER'&&ride.customerId!==req.user.id)fail(403,'Not your trip');if(req.user.role==='ADMIN')branchGuard(req,ride.branchId);if(req.user.role==='DRIVER'&&ride.assignedDriverId!==req.user.id)fail(403,'Not your trip')}
export const list =wrap(async(req,res)=>{const where={};if(req.query.rideId){const ride=await Ride.findByPk(positive(req.query.rideId));await allowRide(req,ride);where.rideId=ride.id;}else if(req.user.role==='CUSTOMER'){const rides=await Ride.findAll({where:{customerId:req.user.id},attributes:['id']});where.rideId=rides.map(x=>x.id)}else if(req.user.role==='DRIVER')where.collectedBy=req.user.id;else if(req.user.role==='ADMIN'){const rides=await Ride.findAll({where:{branchId:req.user.branchId},attributes:['id']});where.rideId=rides.map(x=>x.id)}
 res.json(await Payment.findAll({where,order:[['id','DESC']],limit:500}))});
export const cash =wrap(async(req,res)=>{const ride=await Ride.findByPk(positive(req.params.rideId));await allowRide(req,ride);if(ride.status!=='COMPLETED')fail(409,'Finish the trip before collecting cash');const amount=num(req.body.amount,'amount',0.01);if(amount>1000000)fail(400,'Amount too high');
 const result=await recalculate(ride);if(amount>result.outstanding+0.009)fail(422,'Amount exceeds outstanding balance');const payment=await Payment.create({rideId:ride.id,customerId:ride.customerId,collectedBy:req.user.id,amount,method:'CASH',status:'SUCCESS',notes:req.body.notes||null});await recalculate(ride);await audit(req,'CASH_RECORDED','Payment',payment.id);res.status(201).json(payment)});
export const createOrder =wrap(async(req,res)=>{const ride=await Ride.findByPk(positive(req.params.rideId));await allowRide(req,ride);if(ride.status!=='COMPLETED')fail(409,'Trip must finish before payment');const totals=await recalculate(ride);if(totals.outstanding<=0)fail(409,'Trip is fully paid');const gateway=getGateway();const amountPaise=Math.round(totals.outstanding*100);
 const order=await gateway.orders.create({amount:amountPaise,currency:'INR',receipt:`ride_${ride.id}_${Date.now()}`,notes:{rideId:String(ride.id)}});
 const payment=await Payment.create({rideId:ride.id,customerId:ride.customerId,amount:totals.outstanding,method:'RAZORPAY',status:'CREATED',providerOrderId:order.id});res.json({orderId:order.id,amount:order.amount,currency:order.currency,keyId:process.env.RAZORPAY_KEY_ID,recordId:payment.id})});
async function markPaid(orderId,paymentId,req){
 const rec=await Payment.findOne({where:{providerOrderId:orderId}});if(!rec)fail(404,'Payment order not found');
 if(rec.status==='SUCCESS')return rec;
 const gateway=getGateway();const rzpPayment=await gateway.payments.fetch(paymentId);
 if(rzpPayment.order_id!==orderId||rzpPayment.status!=='captured'||Number(rzpPayment.amount)!==Math.round(Number(rec.amount)*100))fail(409,'Payment not captured or amount mismatch');
 await rec.update({status:'SUCCESS',providerPaymentId:paymentId});const ride=await Ride.findByPk(rec.rideId);await recalculate(ride);if(req)await audit(req,'RAZORPAY_CAPTURED','Payment',rec.id);return rec;
}
export const verify =wrap(async(req,res)=>{const {razorpay_order_id:orderId,razorpay_payment_id:paymentId,razorpay_signature:signature}=req.body;
 if(!orderId||!paymentId||!signature)fail(400,'Missing gateway response');const rec=await Payment.findOne({where:{providerOrderId:orderId}});if(!rec)fail(404,'Unknown order');const ride=await Ride.findByPk(rec.rideId);await allowRide(req,ride);
 const expected=crypto.createHmac('sha256',process.env.RAZORPAY_KEY_SECRET||'').update(`${orderId}|${paymentId}`).digest('hex');if(!/^[a-f0-9]{64}$/.test(signature)||!crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))fail(403,'Payment signature invalid');res.json(await markPaid(orderId,paymentId,req))});
export const webhook =wrap(async(req,res)=>{if(!process.env.RAZORPAY_WEBHOOK_SECRET)fail(503,'Webhook secret not configured');const signature=req.headers['x-razorpay-signature']||'';const expected=crypto.createHmac('sha256',process.env.RAZORPAY_WEBHOOK_SECRET).update(req.body).digest('hex');if(!/^[a-f0-9]{64}$/.test(signature)||!crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))fail(403,'Invalid webhook signature');
 const payload=JSON.parse(req.body.toString('utf8'));if(['payment.captured','order.paid'].includes(payload.event)){const payment=payload.payload?.payment?.entity;if(payment?.order_id&&payment?.id)await markPaid(payment.order_id,payment.id,null)}res.json({ok:true})});
