import { Branch } from "../models/index.js";
import { wrap, fail, positive } from "../utils/http.js";
import { validPoint } from "../utils/geo.js";
import { audit } from "../services/audit.js";

function validate(body){if(body.polygon!==undefined){if(!Array.isArray(body.polygon)||body.polygon.length>200||body.polygon.length!==0&&body.polygon.length<3||!body.polygon.every(validPoint))fail(400,'Polygon needs 3–200 valid map points or an empty array')};if(body.centerLat!==undefined&&body.centerLng!==undefined&&!validPoint({lat:body.centerLat,lng:body.centerLng}))fail(400,'Invalid center')}
export const list =wrap(async(req,res)=>{const where=req.user?.role==='ADMIN'?{id:req.user.branchId}:{};res.json(await Branch.findAll({where,order:[['name','ASC']]}))});
export const create =wrap(async(req,res)=>{validate(req.body);if(!req.body.name||!req.body.code)fail(400,'Name and branch code required');let b=await Branch.create({name:req.body.name,code:String(req.body.code).toUpperCase(),centerLat:req.body.centerLat,centerLng:req.body.centerLng,polygon:req.body.polygon||[]});await audit(req,'BRANCH_CREATED','Branch',b.id,null,b.toJSON());res.status(201).json(b)});
export const update =wrap(async(req,res)=>{let b=await Branch.findByPk(positive(req.params.id));if(!b)fail(404,'Branch not found');validate(req.body);let before=b.toJSON();await b.update(Object.fromEntries(['name','centerLat','centerLng','polygon','active'].filter(k=>req.body[k]!==undefined).map(k=>[k,req.body[k]])));await audit(req,'BRANCH_UPDATED','Branch',b.id,before,b.toJSON());res.json(b)});
