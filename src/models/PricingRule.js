import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class PricingRule extends Model {}
export default (sequelize) => {
 PricingRule.init({
  branchId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  service: {type: DataTypes.STRING(32), allowNull: false},
  config: {type: DataTypes.JSON, allowNull: false},
  version: {type: DataTypes.INTEGER, defaultValue: 1},
  active: {type: DataTypes.BOOLEAN, defaultValue: true}
 }, { sequelize, modelName: 'PricingRule', tableName: 'pricing_rules' });
 return PricingRule;
};
