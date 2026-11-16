import SequelizePkg from 'sequelize';
const { Model, DataTypes } = SequelizePkg;
class VehicleServiceLog extends Model {}
export default (sequelize) => {
  VehicleServiceLog.init({
    vehicleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    branchId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    serviceDate: { type: DataTypes.DATEONLY, allowNull: false },
    category: { type: DataTypes.STRING(60), allowNull: false },
    workshop: DataTypes.STRING(180),
    description: { type: DataTypes.TEXT, allowNull: false },
    odometerKm: DataTypes.FLOAT,
    partsCost: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    labourCost: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    totalCost: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    nextServiceKm: DataTypes.FLOAT,
    nextServiceDate: DataTypes.DATEONLY,
    invoiceDocument: DataTypes.STRING(255),
    expenseId: DataTypes.INTEGER.UNSIGNED,
    createdBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  }, { sequelize, modelName: 'VehicleServiceLog', tableName: 'vehicle_service_logs', indexes: [{ fields: ['vehicle_id', 'service_date'] }] });
  return VehicleServiceLog;
};
