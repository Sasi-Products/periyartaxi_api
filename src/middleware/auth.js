import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { fail, wrap } from "../utils/http.js";

const auth=wrap(async(req,res,next)=>{
 const token=/^Bearer (.+)$/i.exec(req.headers.authorization||'')?.[1];if(!token)fail(401,'Authentication required');
 let payload;try{payload=jwt.verify(token,process.env.JWT_SECRET)}catch{fail(401,'Invalid or expired session')}
 const u=await User.findByPk(payload.sub);if(!u||!u.active||u.tokenVersion!==payload.ver)fail(401,'Session is no longer valid');
 if(u.mustChangePassword && !['/api/auth/me', '/api/auth/change-password', '/api/auth/logout-all'].includes(req.originalUrl.split('?')[0]))fail(403,'Change your temporary password before continuing');
 req.user=u;next();
});
const role=(...allowed)=>(req,res,next)=>{if((req.user?.role!=='SUPER_ADMIN'||allowed.every(r=>['DRIVER','CUSTOMER'].includes(r)))&&!allowed.includes(req.user?.role))return next(Object.assign(new Error('Forbidden'),{status:403}));next()};
const hasPermission=(user,p)=>user?.role==='SUPER_ADMIN'||(user?.role==='ADMIN'&&(()=>{let perms=user.permissions;try{if(typeof perms==='string')perms=JSON.parse(perms)}catch{perms=[]}return Array.isArray(perms)&&perms.includes(p)})());
const permit=p=>(req,res,next)=>{if(hasPermission(req.user,p))return next();
 return next(Object.assign(new Error(`Missing permission: ${p}`),{status:403}));};
const adminOnly=(p)=>(req,res,next)=>{if(!['SUPER_ADMIN','ADMIN'].includes(req.user?.role))return next(Object.assign(new Error('Admin only'),{status:403}));permit(p)(req,res,next)};
const branchGuard=(req,branchId)=>{if(req.user.role==='SUPER_ADMIN')return;
 if(['ADMIN','DRIVER'].includes(req.user.role)&&Number(req.user.branchId)!==Number(branchId))fail(403,'Access denied to this branch')};
export { auth,role,permit,adminOnly,branchGuard,hasPermission };
