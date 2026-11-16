import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class DriverLocation extends Model {}
export default (sequelize) => {
 DriverLocation.init({
  driverId: {type: DataTypes.INTEGER.UNSIGNED,allowNull:false,unique:true},
  branchId: DataTypes.INTEGER.UNSIGNED,
  lat: {type: DataTypes.DOUBLE,allowNull:false},
  lng: {type: DataTypes.DOUBLE,allowNull:false},
  accuracy: DataTypes.FLOAT,
  speed: DataTypes.FLOAT,
  heading: DataTypes.FLOAT,
  reportedAt: {type: DataTypes.DATE,allowNull:false}
 }, { sequelize, modelName: 'DriverLocation', tableName: 'driver_locations' });
 return DriverLocation;
};
