import { fail } from "../utils/http.js";
import { validPoint } from "../utils/geo.js";

function decodePolyline(str){let idx=0,lat=0,lng=0,result=[];while(idx<str.length){let shift=0,b,val=0;do{b=str.charCodeAt(idx++)-63;val|=(b&31)<<shift;shift+=5}while(b>=32);lat+=val&1?~(val>>1):(val>>1);shift=0;val=0;do{b=str.charCodeAt(idx++)-63;val|=(b&31)<<shift;shift+=5}while(b>=32);lng+=val&1?~(val>>1):(val>>1);result.push({lat:lat/1e5,lng:lng/1e5});}return result;}
async function getRoute(pickup,dropoff){
 if(!validPoint(pickup)||!validPoint(dropoff))fail(400,'Valid pickup and dropoff coordinates required');
 if(!process.env.GOOGLE_MAPS_SERVER_KEY)fail(503,'Google Routes API server key is not configured');
 const ac=new AbortController(),timeout=setTimeout(()=>ac.abort(),12000);
 let data;try{
 const response=await fetch('https://routes.googleapis.com/directions/v2:computeRoutes',{
  method:'POST',signal:ac.signal,
  headers:{'Content-Type':'application/json','X-Goog-Api-Key':process.env.GOOGLE_MAPS_SERVER_KEY,'X-Goog-FieldMask':'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'},
  body:JSON.stringify({origin:{location:{latLng:{latitude:Number(pickup.lat),longitude:Number(pickup.lng)}}},destination:{location:{latLng:{latitude:Number(dropoff.lat),longitude:Number(dropoff.lng)}}},travelMode:'DRIVE',routingPreference:'TRAFFIC_UNAWARE',polylineQuality:'HIGH_QUALITY',computeAlternativeRoutes:false,regionCode:'IN',units:'METRIC'})});
 data=await response.json();if(!response.ok)fail(503,`Google Routes API error: ${data.error?.message||response.status}`);
 }catch(e){if(e.status)throw e;fail(503,'Unable to get driving route from Google Routes API')}finally{clearTimeout(timeout)}
 const route=data.routes?.[0];if(!route?.distanceMeters||!route?.duration)fail(422,'Driving route unavailable');
 const polyline=route.polyline?.encodedPolyline||'';
 return{distanceKm:route.distanceMeters/1000,durationMinutes:parseFloat(route.duration)/60,routePoints:decodePolyline(polyline).slice(0,10000),overviewPolyline:polyline};
}
export { getRoute,decodePolyline };
