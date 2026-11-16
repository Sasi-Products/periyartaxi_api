import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class RideCharge extends Model {}
export default (sequelize) => {
 RideCharge.init({
  rideId: {type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  type: {type:DataTypes.ENUM('DRIVER_BETA','TOLL','PARKING','FOOD','HILL','WAITING','EXTRA_KM','OTHER'),allowNull:false},
  amount: {type:DataTypes.DECIMAL(12,2),allowNull:false},
  note: DataTypes.TEXT,
  createdBy: DataTypes.INTEGER.UNSIGNED,
  approvedBy: DataTypes.INTEGER.UNSIGNED,
  status: {type:DataTypes.ENUM('PENDING','APPROVED','REJECTED'),defaultValue:'PENDING'}
 }, { sequelize, modelName: 'RideCharge', tableName: 'ride_charges' });
 return RideCharge;
};
