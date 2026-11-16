import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class Attendance extends Model {}
export default (sequelize) => {
 Attendance.init({
  userId: {type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  branchId: DataTypes.INTEGER.UNSIGNED,
  day: {type:DataTypes.DATEONLY,allowNull:false},
  checkInAt: DataTypes.DATE,
  checkOutAt: DataTypes.DATE,
  status: {type:DataTypes.ENUM('PRESENT','ABSENT','LEAVE','HALF_DAY'),defaultValue:'PRESENT'},
  notes: DataTypes.TEXT
 }, { sequelize, modelName: 'Attendance', tableName: 'attendance' });
 return Attendance;
};
