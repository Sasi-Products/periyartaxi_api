import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class Review extends Model {}
export default (sequelize) => {
 Review.init({
  rideId: {type:DataTypes.INTEGER.UNSIGNED,allowNull:false,unique:true},
  customerId: {type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  rating: {type:DataTypes.INTEGER,allowNull:false},
  comment: DataTypes.TEXT
 }, { sequelize, modelName: 'Review', tableName: 'reviews' });
 return Review;
};
