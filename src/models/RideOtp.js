import SequelizePkg from 'sequelize';
const { Model, DataTypes } = SequelizePkg;
class RideOtp extends Model {}
export default (sequelize) => {
  RideOtp.init({
    rideId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    stage: { type: DataTypes.ENUM('START', 'END'), allowNull: false },
    codeHash: { type: DataTypes.STRING(255), allowNull: false },
    destinationHint: DataTypes.STRING(40),
    issuedAt: { type: DataTypes.DATE, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    usedAt: DataTypes.DATE,
    attempts: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    requestedBy: DataTypes.INTEGER.UNSIGNED,
  }, { sequelize, modelName: 'RideOtp', tableName: 'ride_otps', indexes: [{ unique: true, fields: ['ride_id', 'stage'] }] });
  return RideOtp;
};
