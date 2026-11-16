import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class FcmDevice extends Model {}
export default (sequelize) => {
 FcmDevice.init({
  userId: {type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  token: {type:DataTypes.STRING(512),allowNull:false,unique:true},
  platform: DataTypes.STRING(20)
 }, { sequelize, modelName: 'FcmDevice', tableName: 'fcm_devices' });
 return FcmDevice;
};
