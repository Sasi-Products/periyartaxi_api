import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class Assignment extends Model {}
export default (sequelize) => {
 Assignment.init({
  driverId: {type: DataTypes.INTEGER.UNSIGNED,allowNull:false},
  vehicleId: {type: DataTypes.INTEGER.UNSIGNED,allowNull:false},
  branchId: {type: DataTypes.INTEGER.UNSIGNED,allowNull:false},
  startsAt: {type: DataTypes.DATE,allowNull:false},
  endsAt: {type: DataTypes.DATE,allowNull:false},
  active: {type: DataTypes.BOOLEAN,defaultValue:true}
 }, { sequelize, modelName: 'Assignment', tableName: 'assignments' });
 return Assignment;
};
