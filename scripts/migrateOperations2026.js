import '../src/config/env.js';
import Sequelize from 'sequelize';
import {sequelize,DriverProfile,PricingRule,LocalPackage,Ride,Payroll,DriverMonthlyMark,StaffDocument} from '../src/models/index.js';
const {DataTypes}=Sequelize;
const qi=sequelize.getQueryInterface();
async function addField(table,model,key){const attrs=model.getAttributes(),field=attrs[key];const name=field.field||key;const have=await qi.describeTable(table);if(!have[name]){const column={type:field.type,allowNull:field.allowNull};
  // Avoid JSON column defaults: MySQL/MariaDB variants reject literal JSON defaults.
  if(field.type?.key!=='JSON'&&field.defaultValue!==undefined)column.defaultValue=field.defaultValue;
  await qi.addColumn(table,name,column);console.log('Added',table,name)}else console.log('Exists',table,name)}
try{
 await sequelize.authenticate();
 for(const name of ['emergencyContacts','adminEnabled','overtimeRate','rentCapabilities'])await addField('driver_profiles',DriverProfile,name);
 // Preserve legacy ENUM salary values for historical records; new APIs disallow selecting them.
 await qi.changeColumn('driver_profiles','salary_type',{type:DataTypes.ENUM('MONTHLY','WEEKLY','DAILY','PER_TRIP','HOURLY'),allowNull:true,defaultValue:'MONTHLY'});
 for(const [table,model,fields] of [
  ['pricing_rules',PricingRule,['vehicleType']],['local_packages',LocalPackage,['vehicleType']],['rides',Ride,['customerVehicle']],
  ['payroll',Payroll,['overtimeHours','overtimeRate','overtimeAmount','paymentMethod','paymentReference','paymentNotes','paidBy']]
 ])for(const key of fields)await addField(table,model,key);
 await qi.changeColumn('payroll','period',{type:DataTypes.STRING(12),allowNull:false});
 await DriverMonthlyMark.sync();await StaffDocument.sync();
 console.log('Operations additive migration completed. Existing records preserved.');
}catch(e){console.error('Operations migration failed:',e);process.exitCode=1}finally{await sequelize.close()}
