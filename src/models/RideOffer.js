import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class RideOffer extends Model {}
export default (sequelize) => {
 RideOffer.init({
  rideId: {type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  driverId: {type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  vehicleId: DataTypes.INTEGER.UNSIGNED,
  expiresAt: {type:DataTypes.DATE,allowNull:false},
  status: {type:DataTypes.ENUM('PENDING','ACCEPTED','REJECTED','EXPIRED'),defaultValue:'PENDING'}
 }, { sequelize, modelName: 'RideOffer', tableName: 'ride_offers' });
 return RideOffer;
};
