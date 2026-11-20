import { PricingRule, LocalPackage, Branch, Ride } from '../models/index.js';
import { wrap,fail,positive,num } from '../utils/http.js';
import { validateConfig,SERVICES,DEFAULTS } from '../services/fare.js';
import { branchGuard } from '../middleware/auth.js';
import { audit } from '../services/audit.js';
import { VEHICLE_CATEGORIES } from '../utils/vehicleCategories.js';
const CATEGORIES=['ALL',...VEHICLE_CATEGORIES,'MANUAL','AUTOMATIC','LUXURY'];
function configObject(value){if(typeof value==='string'){try{value=JSON.parse(value)}catch{return {}}}return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}
function category(service,value){const name=String(value||'ALL').toUpperCase();if(!CATEGORIES.includes(name))fail(400,'Invalid vehicle category');if(service==='DRIVER_RENT'&&!['ALL','MANUAL','AUTOMATIC','LUXURY'].includes(name))fail(400,'Driver rent category must be Manual, Automatic or Luxury');if(service!=='DRIVER_RENT'&&['MANUAL','AUTOMATIC','LUXURY'].includes(name))fail(400,'Select a taxi vehicle category');return name}
export const list=wrap(async(req,res)=>{
 const branchId=positive(req.query.branchId||req.user.branchId,'branch ID');branchGuard(req,branchId);
 const vehicleType=String(req.query.vehicleType||'ALL').toUpperCase();
 const rows=await PricingRule.findAll({where:{branchId,active:true},order:[['version','DESC'],['id','DESC']]});
 res.json(SERVICES.map(service=>{
  const selected=rows.find(r=>r.service===service&&r.vehicleType===vehicleType)||rows.find(r=>r.service===service&&(!r.vehicleType||r.vehicleType==='ALL'));
  return {service,branchId,vehicleType,configuredVehicleType:selected?.vehicleType||'ALL',config:{...DEFAULTS[service],...configObject(selected?.config)},version:selected?.version||0};
 }));
});
export const save=wrap(async(req,res)=>{
 const branchId=positive(req.body.branchId,'branch ID');branchGuard(req,branchId);
 if(!await Branch.findByPk(branchId))fail(404,'Branch not found');
 const service=String(req.body.service||'');if(!SERVICES.includes(service))fail(400,'Invalid service');
 const vehicleType=category(service,req.body.vehicleType);
 const config=validateConfig(service,configObject(req.body.config));
 const matches=await PricingRule.findAll({where:{branchId,service,active:true},order:[['id','DESC']]});
 const existing=matches.find(x=>x.vehicleType===vehicleType)|| (vehicleType==='ALL'?matches.find(x=>!x.vehicleType):null);
 const before=existing?.config||null;
 const row=existing?await existing.update({config,version:existing.version+1,vehicleType}):await PricingRule.create({branchId,service,vehicleType,config,version:1,active:true});
 await audit(req,'PRICING_UPDATED','PricingRule',row.id,before,{vehicleType,config});res.json(row);
});
export const packages=wrap(async(req,res)=>{
 const branchId=positive(req.query.branchId||req.user.branchId,'branch ID');branchGuard(req,branchId);
 res.json(await LocalPackage.findAll({where:{branchId},order:[['active','DESC'],['vehicleType','ASC'],['hours','ASC']]}));
});
function packageData(body,base=null){
 const all={...(base||{}),...body};
 if(!String(all.name||'').trim())fail(400,'Package name required');
 const vehicleType=category('LOCAL_PACKAGE',all.vehicleType||'ALL');
 const data={name:String(all.name).trim().slice(0,120),vehicleType};
 for(const key of ['hours','kms','baseFare','extraHour','extraKm'])data[key]=num(all[key],key,0);
 if(data.hours<=0||data.kms<=0)fail(400,'Included hours and km must be positive');
 data.active=all.active!==false;return data;
}
export const addPackage=wrap(async(req,res)=>{
 const branchId=positive(req.body.branchId,'branch ID');branchGuard(req,branchId);
 const row=await LocalPackage.create({...packageData(req.body),branchId});await audit(req,'PACKAGE_CREATED','LocalPackage',row.id);res.status(201).json(row);
});
export const editPackage=wrap(async(req,res)=>{
 const row=await LocalPackage.findByPk(positive(req.params.id));if(!row)fail(404,'Package missing');branchGuard(req,row.branchId);
 const before=row.toJSON();await row.update(packageData(req.body,before));await audit(req,'PACKAGE_UPDATED','LocalPackage',row.id,before,row.toJSON());res.json(row);
});
// Soft-deactivate so historical rides and quotations always retain their package reference.
export const deletePackage=wrap(async(req,res)=>{
 const row=await LocalPackage.findByPk(positive(req.params.id));if(!row)fail(404,'Package missing');branchGuard(req,row.branchId);
 await row.update({active:false});await audit(req,'PACKAGE_DISABLED','LocalPackage',row.id);
 res.json({id:row.id,active:false,message:'Package deactivated; past rides preserved'});
});
