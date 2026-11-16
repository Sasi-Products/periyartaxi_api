import _pkg_sequelize from "sequelize";
import { Ride, RideOffer } from "../models/index.js";
import { dispatch } from "../services/dispatch.js";
const {Op} = _pkg_sequelize;
let active=false;
async function cycle(){if(active)return;active=true;try{
 const expired=await RideOffer.findAll({where:{status:'PENDING',expiresAt:{[Op.lte]:new Date()}},limit:100});for(const o of expired)await o.update({status:'EXPIRED'});
 const rides=await Ride.findAll({where:{status:{[Op.in]:['REQUESTED','SEARCHING','OFFERED','NO_DRIVER','ASSIGNED']},scheduledAt:{[Op.lte]:new Date(Date.now()+15*60_000)}},order:[['createdAt','ASC']],limit:100});
 for(const ride of rides){try{await dispatch(ride.id)}catch(e){console.error('Dispatch:',e.message)}}
 }catch(e){console.error('Dispatch worker:',e.message)}finally{active=false}}
function start(){setInterval(cycle,15000).unref();cycle()}
export { start };
