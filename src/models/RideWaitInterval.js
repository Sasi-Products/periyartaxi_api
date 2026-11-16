import SequelizePkg from 'sequelize';
const { Model, DataTypes } = SequelizePkg;
class RideWaitInterval extends Model {}
export default (sequelize) => {
  RideWaitInterval.init({
    rideId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    startedAt: { type: DataTypes.DATE, allowNull: false },
    endedAt: DataTypes.DATE,
    reason: { type: DataTypes.STRING(240), allowNull: false },
    note: DataTypes.TEXT,
    source: { type: DataTypes.ENUM('DRIVER', 'OPERATOR'), allowNull: false },
    status: { type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'), defaultValue: 'PENDING' },
    createdBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    reviewedBy: DataTypes.INTEGER.UNSIGNED,
    reviewedAt: DataTypes.DATE,
  }, { sequelize, modelName: 'RideWaitInterval', tableName: 'ride_wait_intervals', indexes: [{ fields: ['ride_id', 'started_at'] }] });
  return RideWaitInterval;
};
