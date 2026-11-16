import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { wrap, fail } from "../utils/http.js";
import { dirname as _dirname } from 'node:path';
import { fileURLToPath as _fileURLToPath } from 'node:url';
const __dirname = _dirname(_fileURLToPath(import.meta.url));

const dir=path.join(__dirname,'../../uploads');fs.mkdirSync(dir,{recursive:true});
const storage=multer.diskStorage({destination:dir,filename:(req,file,cb)=>cb(null,`user_${req.user.id}_${crypto.randomBytes(16).toString('hex')}${({ 'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','application/pdf':'.pdf'})[file.mimetype]||''}`)});
export const upload =multer({storage,limits:{fileSize:5*1024*1024,files:1},fileFilter:(req,file,cb)=>cb(null,['image/jpeg','image/png','image/webp','application/pdf'].includes(file.mimetype))}).single('file');
export const done =wrap(async(req,res)=>{if(!req.file)fail(400,'JPG, PNG, WebP or PDF file under 5MB required');res.status(201).json({name:req.file.filename,privateUrl:'/api/uploads/'+req.file.filename})});
export const file =wrap(async(req,res)=>{const name=String(req.params.filename||'');if(!/^user_\d+_[a-f0-9]{32}\.(jpg|png|webp|pdf)$/.test(name))fail(400,'Invalid filename');const owner=Number(name.split('_')[1]);if(req.user.id!==owner&&!['ADMIN','SUPER_ADMIN'].includes(req.user.role))fail(403,'Forbidden');const file=path.join(dir,name);if(!fs.existsSync(file))fail(404,'File not found');res.setHeader('Cache-Control','private, no-store');res.sendFile(file)});
