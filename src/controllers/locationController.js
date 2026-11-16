import { DriverShift, DriverLocation, User } from "../models/index.js";
import { wrap, fail, positive } from "../utils/http.js";
import { validPoint } from "../utils/geo.js";
import { emitDriverLocation } from "../services/socket.js";
import { branchGuard } from "../middleware/auth.js";

export const update =wrap(async(req,res)=>{const p={lat:Number(req.body.lat),lng:Number(req.body.lng)};if(!validPoint(p))fail(400,'Invalid GPS coordinates');const shift=await DriverShift.findOne({where:{driverId:req.user.id,active:true}});if(!shift)fail(403,'Location updates are allowed only during duty');
 const accuracy=Number(req.body.accuracy||0);if(accuracy<0||accuracy>10000)fail(400,'Invalid accuracy');
 const fields={branchId:req.user.branchId,lat:p.lat,lng:p.lng,accuracy,reportedAt:new Date(),speed:Number(req.body.speed||0),heading:Number(req.body.heading||0)};
 const [entry]=await DriverLocation.findOrCreate({where:{driverId:req.user.id},defaults:fields});if(entry.reportedAt<new Date(Date.now()-500))await entry.update(fields);
 emitDriverLocation(req.user.branchId,req.user.id,fields);res.json({success:true,reportedAt:entry.reportedAt})});
export const one =wrap(async(req,res)=>{const driverId=positive(req.params.driverId),d=await User.findByPk(driverId);if(!d||d.role!=='DRIVER')fail(404,'Driver not found');branchGuard(req,d.branchId);const loc=await DriverLocation.findOne({where:{driverId}});if(!loc||Date.now()-new Date(loc.reportedAt).getTime()>Number(process.env.LOCATION_STALE_SECONDS||120)*1000)fail(404,'No recent duty location available');res.json(loc)});
