import { fail } from "./http.js";

const requireFields=(body,fields)=>{for(const k of fields){if(body[k]===undefined||body[k]===null||String(body[k]).trim()==='')fail(400,`${k} required`);}};
const only=(obj,fields)=>Object.fromEntries(fields.filter(k=>obj[k]!==undefined).map(k=>[k,obj[k]]));
const mobile=v=>{if(!/^\+?[1-9]\d{9,14}$/.test(String(v||'').replace(/\s/g,'')))fail(400,'Valid mobile required');return String(v).replace(/\s/g,'')};
export { requireFields,only,mobile };
