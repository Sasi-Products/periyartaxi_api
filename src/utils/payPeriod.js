import { fail } from './http.js';
export function payPeriod(value){
 const p=String(value||'');
 if(/^\d{4}-(0[1-9]|1[0-2])$/.test(p)){
  const [year,month]=p.split('-').map(Number);
  return {period:p,kind:'MONTH',start:new Date(Date.UTC(year,month-1,1)),end:new Date(Date.UTC(year,month,1))};
 }
 const m=p.match(/^(\d{4})-W(\d{2})$/);
 if(!m) fail(400,'Pay period must be YYYY-MM or YYYY-Www');
 const year=Number(m[1]),week=Number(m[2]);if(week<1||week>53)fail(400,'Invalid ISO week');
 const jan4=new Date(Date.UTC(year,0,4));const monday=new Date(jan4);monday.setUTCDate(jan4.getUTCDate()-((jan4.getUTCDay()+6)%7)+7*(week-1));
 const thursday=new Date(monday);thursday.setUTCDate(monday.getUTCDate()+3);
 if(thursday.getUTCFullYear()!==year)fail(400,'Invalid week for selected year');
 const end=new Date(monday);end.setUTCDate(monday.getUTCDate()+7);
 return {period:p,kind:'WEEK',start:monday,end};
}
export const inPeriod=(day,period)=>day>=period.start.toISOString().slice(0,10)&&day<period.end.toISOString().slice(0,10);
