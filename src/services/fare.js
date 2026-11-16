import { money, fail, num } from "../utils/http.js";
import { kmOutsideRoute } from "../utils/geo.js";


const SERVICES=['LOCAL','LOCAL_PACKAGE','OUTSTATION','DRIVER_RENT','VALET'];
const DEFAULTS={
 LOCAL:{baseKm:3,baseFare:100,extraKm:21,boundaryFee:70,graceKm:3,convertAfterKm:3,waitingPerMinute:0,waitingGraceMinutes:0},
 LOCAL_PACKAGE:{boundaryFee:70,graceKm:3,convertAfterKm:3},
 OUTSTATION:{shortThresholdKm:100,minFare:450,includedKm:30,perKm:13,shortIncludedHours:3,longIncludedHours:5,extraHour:80,oneWayDistanceMultiplier:1,roundTripDistanceMultiplier:2},
 DRIVER_RENT:{minimumHours:6,minimumFare:700,extraHour:55},
 VALET:{minimumHours:0,perDriverBaseFare:0,extraHourPerDriver:0,maxDrivers:30}
};
const nonneg=(value,label)=>num(value,label,0);
const amounts=(o,keys)=>{for(const key of keys)nonneg(o[key],key)};
function validateConfig(service,config){
 if(!SERVICES.includes(service)||!config||typeof config!=='object'||Array.isArray(config))fail(400,'Invalid pricing rule');
 const cfg={...DEFAULTS[service],...config};
 if(service==='LOCAL'){amounts(cfg,['baseKm','baseFare','extraKm','boundaryFee','graceKm','convertAfterKm','waitingPerMinute','waitingGraceMinutes']);if(!cfg.baseKm)fail(400,'baseKm must be positive')}
 if(service==='LOCAL_PACKAGE')amounts(cfg,['boundaryFee','graceKm','convertAfterKm']);
 if(service==='OUTSTATION'){amounts(cfg,['shortThresholdKm','minFare','includedKm','perKm','shortIncludedHours','longIncludedHours','extraHour','oneWayDistanceMultiplier','roundTripDistanceMultiplier']);if(cfg.shortThresholdKm<=cfg.includedKm)fail(400,'Outstation threshold must exceed included KM')}
 if(service==='DRIVER_RENT')amounts(cfg,['minimumHours','minimumFare','extraHour']);
 if(service==='VALET')amounts(cfg,['minimumHours','perDriverBaseFare','extraHourPerDriver','maxDrivers']);
 return cfg;
}
function quoteFare(input){
 let {service,distanceKm=0,durationMinutes=0,hours,tripMode='ONE_WAY',packageData,config={},routePoints=[],polygon=[],requiredDrivers=1}=input;
 if(!SERVICES.includes(service))fail(400,'Unknown service');
 distanceKm=nonneg(distanceKm,'distanceKm');durationMinutes=nonneg(durationMinutes,'durationMinutes');
 let h=hours===undefined?durationMinutes/60:nonneg(hours,'hours');
 let cfg=validateConfig(service,config);let convertedFrom=null;
 let outsideKm=polygon?.length&&routePoints?.length?kmOutsideRoute(routePoints,polygon):0;
 if(['LOCAL','LOCAL_PACKAGE'].includes(service)&&outsideKm>0&&outsideKm>cfg.convertAfterKm){
   convertedFrom=service;service='OUTSTATION';cfg=validateConfig(service,input.outstationConfig||{});
 }
 let baseFare=0,extraKmFare=0,extraHourFare=0,boundaryCharge=0,formula='',billedKm=distanceKm;
 if(service==='LOCAL'){
   baseFare=Number(cfg.baseFare);extraKmFare=Math.max(0,distanceKm-cfg.baseKm)*cfg.extraKm;
   boundaryCharge=outsideKm>0&&outsideKm<=cfg.graceKm?Number(cfg.boundaryFee):0;
   formula=`${cfg.baseKm} km base + ${cfg.extraKm}/extra km`;
 }else if(service==='LOCAL_PACKAGE'){
   if(!packageData)fail(400,'Choose a local package');
   const p=packageData;baseFare=nonneg(p.baseFare,'package baseFare');
   extraKmFare=Math.max(0,distanceKm-num(p.kms,'package kms'))*nonneg(p.extraKm,'package extraKm');
   extraHourFare=Math.max(0,h-num(p.hours,'package hours'))*nonneg(p.extraHour,'package extraHour');
   boundaryCharge=outsideKm>0&&outsideKm<=cfg.graceKm?Number(cfg.boundaryFee):0;
   formula=`${p.hours} hrs / ${p.kms} km package`;
 }else if(service==='OUTSTATION'){
   const multiplier=tripMode==='ROUND_TRIP'?cfg.roundTripDistanceMultiplier:cfg.oneWayDistanceMultiplier;
   billedKm=distanceKm*multiplier;
   if(billedKm<cfg.shortThresholdKm){baseFare=cfg.minFare;extraKmFare=Math.max(0,billedKm-cfg.includedKm)*cfg.perKm;}
   else{baseFare=billedKm*cfg.perKm;}
   const includedHours=billedKm<cfg.shortThresholdKm?cfg.shortIncludedHours:cfg.longIncludedHours;
   extraHourFare=Math.max(0,h-includedHours)*cfg.extraHour;
   formula=`${tripMode} ${billedKm.toFixed(2)} billable km`;
 }else if(service==='DRIVER_RENT'){
   baseFare=cfg.minimumFare;extraHourFare=Math.max(0,h-cfg.minimumHours)*cfg.extraHour;
   formula=`${cfg.minimumHours} hrs minimum; own vehicle`;
 }else if(service==='VALET'){
   if(cfg.perDriverBaseFare<=0)fail(422,'Configure valet pricing in Super Admin before quoting');
   const drivers=num(requiredDrivers,'requiredDrivers',1);if(!Number.isInteger(drivers)||drivers>cfg.maxDrivers)fail(400,'Invalid valet driver count');
   baseFare=drivers*cfg.perDriverBaseFare;extraHourFare=drivers*Math.max(0,h-cfg.minimumHours)*cfg.extraHourPerDriver;
   formula=`${drivers} valet drivers`;
 }
 const components={baseFare:money(baseFare),extraKmFare:money(extraKmFare),extraHourFare:money(extraHourFare),boundaryCharge:money(boundaryCharge)};
 return{service,convertedFrom,tripMode,formula,distKm:distanceKm,billedKm:money(billedKm),hours:money(h),outsideKm:money(outsideKm),components,total:money(Object.values(components).reduce((a,b)=>a+b,0)),pricingSnapshot:cfg,packageSnapshot:packageData||null};
}
export { quoteFare,validateConfig,DEFAULTS,SERVICES };
