import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class Payroll extends Model {}
export default (sequelize) => {
 Payroll.init({
  userId: {type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  branchId: DataTypes.INTEGER.UNSIGNED,
  period: {type:DataTypes.STRING(7),allowNull:false},
  baseAmount: {type:DataTypes.DECIMAL(12,2),defaultValue:0},
  incentives: {type:DataTypes.DECIMAL(12,2),defaultValue:0},
  deductions: {type:DataTypes.DECIMAL(12,2),defaultValue:0},
  netAmount: {type:DataTypes.DECIMAL(12,2),defaultValue:0},
  status: {type:DataTypes.ENUM('DRAFT','APPROVED','PAID'),defaultValue:'DRAFT'},
  paidAt: DataTypes.DATE,
  notes: DataTypes.TEXT
 }, { sequelize, modelName: 'Payroll', tableName: 'payroll' });
 return Payroll;
};
