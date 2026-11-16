import SequelizePkg from 'sequelize';
const { Model, DataTypes } = SequelizePkg;
class RideGpsSample extends Model {}
export default (sequelize) => {
  RideGpsSample.init({
    rideId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    driverId: DataTypes.INTEGER.UNSIGNED,
    vehicleId: DataTypes.INTEGER.UNSIGNED,
    source: { type: DataTypes.ENUM('DRIVER_PHONE', 'VEHICLE_GPS'), allowNull: false },
    observedAt: { type: DataTypes.DATE, allowNull: false },
    lat: { type: DataTypes.DOUBLE, allowNull: false },
    lng: { type: DataTypes.DOUBLE, allowNull: false },
    speedKmh: DataTypes.FLOAT,
    accuracyM: DataTypes.FLOAT,
  }, { sequelize, modelName: 'RideGpsSample', tableName: 'ride_gps_samples', indexes: [{ fields: ['ride_id', 'observed_at'] }] });
  return RideGpsSample;
};
