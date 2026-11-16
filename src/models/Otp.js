import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class Otp extends Model {}
export default (sequelize) => {
 Otp.init({
  mobile: {type:DataTypes.STRING(20),allowNull:false},
  codeHash: {type:DataTypes.STRING(255),allowNull:false},
  expiresAt: {type:DataTypes.DATE,allowNull:false},
  attempts: {type:DataTypes.INTEGER,defaultValue:0},
  usedAt: DataTypes.DATE
 }, { sequelize, modelName: 'Otp', tableName: 'otps' });
 return Otp;
};
