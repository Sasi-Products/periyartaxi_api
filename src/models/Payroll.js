import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class Payroll extends Model {}
export default (sequelize) => {
 Payroll.init({
  userId: {type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  branchId: DataTypes.INTEGER.UNSIGNED,
  period: {type:DataTypes.STRING(12),allowNull:false},
  baseAmount: {type:DataTypes.DECIMAL(12,2),defaultValue:0},
  incentives: {type:DataTypes.DECIMAL(12,2),defaultValue:0},
  overtimeHours: {type:DataTypes.DECIMAL(8,2),defaultValue:0},
  overtimeRate: {type:DataTypes.DECIMAL(12,2),defaultValue:0},
  overtimeAmount: {type:DataTypes.DECIMAL(12,2),defaultValue:0},
  paymentMethod: {type:DataTypes.ENUM('CASH','BANK_TRANSFER','UPI','CHEQUE'),allowNull:true},
  paymentReference: DataTypes.STRING(140),
  paymentNotes: DataTypes.TEXT,
  paidBy: DataTypes.INTEGER.UNSIGNED,
  deductions: {type:DataTypes.DECIMAL(12,2),defaultValue:0},
  netAmount: {type:DataTypes.DECIMAL(12,2),defaultValue:0},
  status: {type:DataTypes.ENUM('DRAFT','APPROVED','PAID'),defaultValue:'DRAFT'},
  paidAt: DataTypes.DATE,
  notes: DataTypes.TEXT
 }, { sequelize, modelName: 'Payroll', tableName: 'payroll' });
 return Payroll;
};
