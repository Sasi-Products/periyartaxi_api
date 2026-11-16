import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class SavedPlace extends Model {}
export default (sequelize) => {
 SavedPlace.init({
  userId: {type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  label: DataTypes.STRING(100),
  address: DataTypes.TEXT,
  lat: DataTypes.DOUBLE,
  lng: DataTypes.DOUBLE
 }, { sequelize, modelName: 'SavedPlace', tableName: 'saved_places' });
 return SavedPlace;
};
