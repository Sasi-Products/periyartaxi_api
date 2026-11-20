import Sequelize from 'sequelize';
const {Model,DataTypes}=Sequelize;
class DriverMonthlyMark extends Model {}
export default sequelize => {
 DriverMonthlyMark.init({
  driverId:{type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  branchId:{type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  month:{type:DataTypes.STRING(7),allowNull:false},
  punctuality:{type:DataTypes.TINYINT.UNSIGNED,allowNull:false},
  customerService:{type:DataTypes.TINYINT.UNSIGNED,allowNull:false},
  safety:{type:DataTypes.TINYINT.UNSIGNED,allowNull:false},
  vehicleCare:{type:DataTypes.TINYINT.UNSIGNED,allowNull:false},
  attendance:{type:DataTypes.TINYINT.UNSIGNED,allowNull:false},
  total:{type:DataTypes.DECIMAL(4,2),allowNull:false},
  notes:DataTypes.TEXT,markedBy:DataTypes.INTEGER.UNSIGNED
 },{sequelize,modelName:'DriverMonthlyMark',tableName:'driver_monthly_marks',indexes:[{unique:true,fields:['driver_id','month']} ]});
 return DriverMonthlyMark;
};
