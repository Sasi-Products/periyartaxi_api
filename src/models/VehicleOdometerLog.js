import SequelizePkg from 'sequelize';
const { Model, DataTypes } = SequelizePkg;
class VehicleOdometerLog extends Model {}
export default (sequelize) => {
  VehicleOdometerLog.init({
    vehicleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    branchId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    readingKm: { type: DataTypes.FLOAT, allowNull: false },
    readingAt: { type: DataTypes.DATE, allowNull: false },
    source: { type: DataTypes.ENUM('MANUAL', 'SERVICE', 'TRIP', 'INSPECTION'), defaultValue: 'MANUAL' },
    note: DataTypes.STRING(500),
    createdBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  }, { sequelize, modelName: 'VehicleOdometerLog', tableName: 'vehicle_odometer_logs', indexes: [{ fields: ['vehicle_id', 'reading_at'] }] });
  return VehicleOdometerLog;
};
