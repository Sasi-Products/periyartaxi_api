import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class LocalPackage extends Model {}
export default (sequelize) => {
 LocalPackage.init({
  branchId: {type: DataTypes.INTEGER.UNSIGNED, allowNull: false},
  name: {type: DataTypes.STRING(120), allowNull: false},
  vehicleType: {type: DataTypes.STRING(40), allowNull: false, defaultValue: 'ALL'},
  hours: {type: DataTypes.FLOAT, allowNull: false},
  kms: {type: DataTypes.FLOAT, allowNull: false},
  baseFare: {type: DataTypes.DECIMAL(12,2), allowNull: false},
  extraHour: {type: DataTypes.DECIMAL(12,2), allowNull: false},
  extraKm: {type: DataTypes.DECIMAL(12,2), allowNull: false},
  active: {type: DataTypes.BOOLEAN, defaultValue: true}
 }, { sequelize, modelName: 'LocalPackage', tableName: 'local_packages' });
 return LocalPackage;
};
