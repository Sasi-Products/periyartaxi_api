import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class Notification extends Model {}
export default (sequelize) => {
 Notification.init({
  userId: {type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  title: {type:DataTypes.STRING(180),allowNull:false},
  body: DataTypes.TEXT,
  data: DataTypes.JSON,
  readAt: DataTypes.DATE
 }, { sequelize, modelName: 'Notification', tableName: 'notifications' });
 return Notification;
};
