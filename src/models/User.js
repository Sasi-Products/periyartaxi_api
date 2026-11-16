import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class User extends Model {}
export default (sequelize) => {
 User.init({
  username: { type: DataTypes.STRING(80), unique: true, allowNull: true },
  mobile: { type: DataTypes.STRING(20), unique: true, allowNull: true },
  name: { type: DataTypes.STRING(140), allowNull: false },
  passwordHash: DataTypes.STRING(255),
  role: { type: DataTypes.ENUM('SUPER_ADMIN','ADMIN','DRIVER','CUSTOMER'), allowNull: false },
  branchId: DataTypes.INTEGER.UNSIGNED,
  permissions: { type: DataTypes.JSON, defaultValue: [] },
  salaryType: {type: DataTypes.ENUM('MONTHLY','DAILY','PER_TRIP','HOURLY'),defaultValue:'MONTHLY'},
  salaryRate: {type: DataTypes.DECIMAL(12,2),defaultValue:0},
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  tokenVersion: { type: DataTypes.INTEGER, defaultValue: 0 },
  mustChangePassword: { type: DataTypes.BOOLEAN, defaultValue: false },
  verifiedAt: DataTypes.DATE
 }, { sequelize, modelName: 'User', tableName: 'users' });
 return User;
};
