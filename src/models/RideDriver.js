import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class RideDriver extends Model {}
export default (sequelize) => {
 RideDriver.init({
  rideId: {type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  driverId: {type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  vehicleId: DataTypes.INTEGER.UNSIGNED,
  status: {type:DataTypes.ENUM('ASSIGNED','COMPLETED','REMOVED'),defaultValue:'ASSIGNED'}
 }, { sequelize, modelName: 'RideDriver', tableName: 'ride_drivers' });
 return RideDriver;
};
