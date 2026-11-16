import { AuditLog } from "../models/index.js";

async function audit(req,action,entity,entityId,before=null,after=null){
 try{await AuditLog.create({actorId:req.user?.id,action,entity,entityId:String(entityId??''),before,after,ip:req.ip})}catch(e){console.error('Audit write failed:',e.message)}
}
export { audit };
