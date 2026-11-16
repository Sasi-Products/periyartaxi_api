import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class DriverShift extends Model {}
export default (sequelize) => {
 DriverShift.init({
  driverId: {type: DataTypes.INTEGER.UNSIGNED,allowNull:false},
  branchId: {type: DataTypes.INTEGER.UNSIGNED,allowNull:false},
  startsAt: {type: DataTypes.DATE,allowNull:false},
  endsAt: DataTypes.DATE,
  active: {type: DataTypes.BOOLEAN,defaultValue:true}
 }, { sequelize, modelName: 'DriverShift', tableName: 'driver_shifts' });
 return DriverShift;
};
