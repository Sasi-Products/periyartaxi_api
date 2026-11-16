
async function sendSms(mobile,otp){
 if(process.env.NODE_ENV!=='production'&&process.env.OTP_DEV_MODE==='true'){
  console.log(`[DEV ONLY] OTP for ${mobile}: ${otp}`);return;
 }
 if(!process.env.MSG91_AUTH_KEY||!process.env.MSG91_FLOW_ID)throw new Error('SMS_PROVIDER_NOT_CONFIGURED');
 const response=await fetch('https://control.msg91.com/api/v5/flow/',{method:'POST',headers:{'content-type':'application/json',authkey:process.env.MSG91_AUTH_KEY},body:JSON.stringify({flow_id:process.env.MSG91_FLOW_ID,sender:process.env.MSG91_SENDER_ID,mobiles:mobile.replace(/^\+/,''),OTP:otp})});
 if(!response.ok)throw new Error(`SMS provider failed: ${response.status}`);
 const data=await response.json();if(data.type&&data.type!=='success')throw new Error('SMS_PROVIDER_ERROR');
}
export { sendSms };
