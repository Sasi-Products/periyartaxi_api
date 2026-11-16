import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class Branch extends Model {}
export default (sequelize) => {
 Branch.init({
  name: { type: DataTypes.STRING(150), allowNull: false },
  code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  centerLat: DataTypes.DOUBLE,
  centerLng: DataTypes.DOUBLE,
  polygon: {type: DataTypes.JSON, defaultValue: []},
  active: {type: DataTypes.BOOLEAN, defaultValue: true}
 }, { sequelize, modelName: 'Branch', tableName: 'branches' });
 return Branch;
};
