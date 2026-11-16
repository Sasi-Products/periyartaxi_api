import fs from "fs";
import admin from "firebase-admin";
import { Notification, FcmDevice } from "../models/index.js";

const path=process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if(path&&fs.existsSync(path)&&!admin.apps.length){try{admin.initializeApp({credential:admin.credential.cert(JSON.parse(fs.readFileSync(path,'utf8')))});}catch(e){console.error('Firebase disabled:',e.message)}}
async function notify(userId,title,body,data={}){
 await Notification.create({userId,title,body,data});
 if(admin.apps.length){const devices=await FcmDevice.findAll({where:{userId}});if(devices.length){
 try{await admin.messaging().sendEachForMulticast({tokens:devices.map(x=>x.token),notification:{title,body},data:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,String(v)]))})}
 catch(e){console.error('FCM send failed:',e.message)} }}
}
export { notify };
