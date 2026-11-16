import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class Payment extends Model {}
export default (sequelize) => {
 Payment.init({
  rideId: {type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  customerId: DataTypes.INTEGER.UNSIGNED,
  collectedBy: DataTypes.INTEGER.UNSIGNED,
  amount: {type:DataTypes.DECIMAL(12,2),allowNull:false},
  method: {type:DataTypes.ENUM('CASH','RAZORPAY'),allowNull:false},
  status: {type:DataTypes.ENUM('CREATED','SUCCESS','FAILED','REVERSED'),defaultValue:'CREATED'},
  providerOrderId: DataTypes.STRING(120),
  providerPaymentId: {type:DataTypes.STRING(120),unique:true},
  reconciledAt: DataTypes.DATE,
  notes: DataTypes.TEXT
 }, { sequelize, modelName: 'Payment', tableName: 'payments' });
 return Payment;
};
