
const radians=n=>n*Math.PI/180;
function kmBetween(a,b){ const lat1=Number(a.lat),lng1=Number(a.lng),lat2=Number(b.lat),lng2=Number(b.lng);
  if(![lat1,lng1,lat2,lng2].every(Number.isFinite))return Infinity;
  const dlat=radians(lat2-lat1),dlon=radians(lng2-lng1);
  return 6371*2*Math.asin(Math.sqrt(Math.sin(dlat/2)**2+Math.cos(radians(lat1))*Math.cos(radians(lat2))*Math.sin(dlon/2)**2)); }
function validPoint(p){return !!p&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng))&&Math.abs(Number(p.lat))<=90&&Math.abs(Number(p.lng))<=180;}
function insidePolygon(p,polygon){if(!validPoint(p)||!Array.isArray(polygon)||polygon.length<3)return false;
 const x=Number(p.lng),y=Number(p.lat);let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if(!validPoint(a)||!validPoint(b))return false;
 const xi=Number(a.lng),yi=Number(a.lat),xj=Number(b.lng),yj=Number(b.lat);
 const intersect=(yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi;if(intersect)inside=!inside;}return inside;}
// Approximate distance of route samples outside the local polygon; use a densified route polyline for accuracy.
function kmOutsideRoute(points,polygon){if(!Array.isArray(points)||points.length<2||!polygon?.length)return 0;
 let km=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(!validPoint(a)||!validPoint(b))continue;
 if(!insidePolygon(a,polygon)||!insidePolygon(b,polygon))km+=kmBetween(a,b);}return km;}
export { kmBetween,insidePolygon,kmOutsideRoute,validPoint };
