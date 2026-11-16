import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class Expense extends Model {}
export default (sequelize) => {
 Expense.init({
  branchId: {type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  vehicleId: DataTypes.INTEGER.UNSIGNED,
  driverId: DataTypes.INTEGER.UNSIGNED,
  category: {type:DataTypes.STRING(60),allowNull:false},
  description: DataTypes.TEXT,
  amount: {type:DataTypes.DECIMAL(12,2),allowNull:false},
  expenseDate: {type:DataTypes.DATEONLY,allowNull:false},
  createdBy: DataTypes.INTEGER.UNSIGNED
 }, { sequelize, modelName: 'Expense', tableName: 'expenses' });
 return Expense;
};
