
class HttpError extends Error { constructor(status, message, code='BAD_REQUEST') { super(message); this.status=status; this.code=code; } }
const fail=(status,message,code)=>{throw new HttpError(status,message,code)};
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const positive=(v,name='ID')=>{const n=Number(v); if(!Number.isSafeInteger(n)||n<1)fail(400,`Valid positive ${name} required`);return n};
const num=(v,name='value',min=0)=>{const n=Number(v);if(!Number.isFinite(n)||n<min)fail(400,`Invalid ${name}`);return n};
const money=n=>Math.round((Number(n)+Number.EPSILON)*100)/100;
export { HttpError,fail,wrap,positive,num,money };
