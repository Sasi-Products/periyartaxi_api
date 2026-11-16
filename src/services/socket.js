import { Server } from 'socket.io';
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
let io;
const configure=(server)=>{
 io=new Server(server,{cors:{origin:(process.env.CORS_ORIGINS||'http://localhost:5173').split(','),credentials:false}});
 io.use(async(socket,next)=>{try{const token=socket.handshake.auth?.token;const claims=jwt.verify(token,process.env.JWT_SECRET);const user=await User.findByPk(claims.sub);if(!user||!user.active||user.tokenVersion!==claims.ver)throw Error();socket.data.user=user;next()}catch{next(new Error('Unauthorized'))}});
 io.on('connection',socket=>{const u=socket.data.user;socket.join('user:'+u.id);if(u.role==='SUPER_ADMIN')socket.join('superadmin');if(['ADMIN','DRIVER'].includes(u.role)&&u.branchId)socket.join('branch:'+u.branchId);});
 return io;
};
function emitRide(ride,event='ride.updated'){if(!io)return;if(ride.customerId)io.to('user:'+ride.customerId).emit(event,ride);if(ride.assignedDriverId)io.to('user:'+ride.assignedDriverId).emit(event,ride);io.to('branch:'+ride.branchId).to('superadmin').emit(event,ride)}
function emitDriverLocation(branchId,driverId,location){if(io)io.to('branch:'+branchId).to('superadmin').emit('driver.location',{driverId,...location})}
export { configure,emitRide,emitDriverLocation };
