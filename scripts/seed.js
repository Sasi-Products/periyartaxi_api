import bcrypt from "bcryptjs";
import { User, Branch, PricingRule, LocalPackage, sequelize } from "../src/models/index.js";
import { DEFAULTS } from "../src/services/fare.js";


(async()=>{if(!process.env.SUPER_ADMIN_PASSWORD||process.env.SUPER_ADMIN_PASSWORD.includes('SET_STRONG_PASSWORD')||process.env.SUPER_ADMIN_PASSWORD.length<12)throw Error('Set a strong SUPER_ADMIN_PASSWORD (12+ chars) in .env');
 await sequelize.authenticate();let branch=await Branch.findOne({where:{code:'ERODE'}});if(!branch)branch=await Branch.create({name:process.env.DEFAULT_BRANCH_NAME||'Erode',code:'ERODE',centerLat:Number(process.env.DEFAULT_BRANCH_LAT||11.341),centerLng:Number(process.env.DEFAULT_BRANCH_LNG||77.7172),polygon:[]});
 const username=process.env.SUPER_ADMIN_USERNAME||'superadmin';let admin=await User.findOne({where:{username}});if(!admin)admin=await User.create({username,name:'Periyar Taxi Super Admin',passwordHash:await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD,12),role:'SUPER_ADMIN',branchId:branch.id,active:true});
 for(const [service,config] of Object.entries(DEFAULTS))await PricingRule.findOrCreate({where:{branchId:branch.id,service},defaults:{config}});
 if(!await LocalPackage.count({where:{branchId:branch.id}}))await LocalPackage.bulkCreate([{branchId:branch.id,name:'2 Hours • 20 KM',hours:2,kms:20,baseFare:420,extraHour:90,extraKm:21},{branchId:branch.id,name:'3 Hours • 30 KM',hours:3,kms:30,baseFare:720,extraHour:90,extraKm:21}]);
 console.log('Seeded branch and initial price examples; login username:',username,'(password from .env)');await sequelize.close();})().catch(e=>{console.error(e);process.exit(1)});
