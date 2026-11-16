import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class RideEvent extends Model {}
export default (sequelize) => {
 RideEvent.init({
  rideId: {type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  actorId: DataTypes.INTEGER.UNSIGNED,
  event: {type:DataTypes.STRING(64),allowNull:false},
  message: DataTypes.TEXT,
  payload: DataTypes.JSON
 }, { sequelize, modelName: 'RideEvent', tableName: 'ride_events' });
 return RideEvent;
};
