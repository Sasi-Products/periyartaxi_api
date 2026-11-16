import Sequelize from 'sequelize';
const { Model, DataTypes } = Sequelize;

class CustomerProfile extends Model {}
export default sequelize => {
  CustomerProfile.init({
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    branchId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    createdVia: { type: DataTypes.ENUM('APP', 'ADMIN', 'SUPER_ADMIN', 'LEGACY'), allowNull: false, defaultValue: 'LEGACY' },
    createdBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    customerType: { type: DataTypes.ENUM('INDIVIDUAL', 'BUSINESS'), allowNull: false, defaultValue: 'INDIVIDUAL' },
    address: { type: DataTypes.TEXT, allowNull: true },
    alternateMobile: { type: DataTypes.STRING(20), allowNull: true },
    preferredLanguage: { type: DataTypes.ENUM('TAMIL', 'ENGLISH', 'OTHER'), allowNull: false, defaultValue: 'TAMIL' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    mobileVerifiedAt: { type: DataTypes.DATE, allowNull: true }
  }, { sequelize, modelName: 'CustomerProfile', tableName: 'customer_profiles', indexes: [{ fields: ['branch_id'] }] });
  return CustomerProfile;
};
