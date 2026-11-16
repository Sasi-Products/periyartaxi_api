import { Branch, PricingRule, LocalPackage } from "../models/index.js";
import { fail, positive } from "../utils/http.js";
import { getRoute } from "./googleMaps.js";
import { quoteFare, DEFAULTS } from "./fare.js";
import { insidePolygon } from "../utils/geo.js";


async function getConfig(branchId,service){const r=await PricingRule.findOne({where:{branchId,service,active:true}});return r?.config||DEFAULTS[service];}
async function buildQuote(req,{branchId,service,pickup,dropoff,packageId,tripMode,requiredDrivers,hours,forceManualRoute=false,manualDistanceKm,manualDurationMinutes}){
 const branch=await Branch.findByPk(positive(branchId,'branch ID'));if(!branch||!branch.active)fail(404,'Branch not found');
 if(req.user&&req.user.role!=='SUPER_ADMIN'&&['ADMIN','DRIVER'].includes(req.user.role)&&Number(req.user.branchId)!==branch.id)fail(403,'Branch restricted');
 if(!pickup||typeof pickup.lat!=='number'||typeof pickup.lng!=='number')fail(400,'Pickup coordinates required');
 if(branch.polygon?.length>=3&&!insidePolygon(pickup,branch.polygon)&&!['OUTSTATION','DRIVER_RENT','VALET'].includes(service))fail(422,'Pickup is outside this branch local boundary');
 let route={distanceKm:0,durationMinutes:0,routePoints:[],overviewPolyline:null};
 if(['LOCAL','LOCAL_PACKAGE','OUTSTATION'].includes(service)){
  if(!dropoff)fail(400,'Drop location required');
  if(forceManualRoute){if(!['SUPER_ADMIN','ADMIN'].includes(req.user.role))fail(403,'Manual route only for operators');
   route={distanceKm:Number(manualDistanceKm),durationMinutes:Number(manualDurationMinutes),routePoints:[pickup,dropoff]};
  }else route=await getRoute(pickup,dropoff);
 }
 let packageData=null;
 if(service==='LOCAL_PACKAGE'){
  const pkg=await LocalPackage.findOne({where:{id:positive(packageId,'package ID'),branchId,active:true}});
  if(!pkg)fail(404,'Active package not found');packageData=pkg.toJSON();
 }
 const config=await getConfig(branch.id,service);
 const outstationConfig=await getConfig(branch.id,'OUTSTATION');
 const estimate=quoteFare({service,...route,packageData,tripMode,requiredDrivers,hours,config,polygon:branch.polygon||[],outstationConfig});
 return{branchId:branch.id,route,estimate};
}
export { getConfig,buildQuote };
