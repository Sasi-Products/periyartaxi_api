import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import multer from 'multer';
import {fail} from '../utils/http.js';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../uploads/staff-private');
const EXT={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','application/pdf':'.pdf'};
export const staffUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:8*1024*1024,files:1},fileFilter(_req,file,cb){if(!EXT[file.mimetype])return cb(Object.assign(new Error('PDF or image only'),{status:400}));cb(null,true)}}).single('file');
function signature(file){const b=file.buffer;const mime=file.mimetype;return mime==='application/pdf'?b.subarray(0,5).toString()==='%PDF-':mime==='image/jpeg'?b.subarray(0,3).equals(Buffer.from([255,216,255])):mime==='image/png'?b.subarray(0,8).toString('hex')==='89504e470d0a1a0a':b.length>=12&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'}
const folder=id=>path.join(ROOT,String(Number(id)));
export async function storeStaffFile(id,file){if(!file||!signature(file))fail(400,'Invalid file signature');await fs.mkdir(folder(id),{recursive:true,mode:0o700});const filename=crypto.randomBytes(24).toString('hex')+EXT[file.mimetype];await fs.writeFile(path.join(folder(id),filename),file.buffer,{flag:'wx',mode:0o600});return filename}
export async function removeStaffFile(id,filename){if(/^[a-f0-9]{48}\.(jpg|png|webp|pdf)$/.test(filename||''))await fs.unlink(path.join(folder(id),filename)).catch(()=>{});}
export async function sendStaffFile(res,id,filename){if(!/^[a-f0-9]{48}\.(jpg|png|webp|pdf)$/.test(filename||''))fail(404,'File missing');const f=path.join(folder(id),filename);try{await fs.access(f)}catch{fail(404,'File missing')}res.set('Cache-Control','private, no-store');res.set('X-Content-Type-Options','nosniff');res.set('Content-Security-Policy','sandbox');res.set('Content-Disposition','attachment; filename="staff-document'+path.extname(filename)+'"');res.sendFile(f)}
