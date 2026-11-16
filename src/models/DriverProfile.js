import { jsonObject } from '../utils/jsonObject.js';
import { driverOnboardingFields } from './driverOnboardingFields.js';
import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class DriverProfile extends Model {}
export default (sequelize) => {
 DriverProfile.init({
  userId: {type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true},
  kind: {type: DataTypes.ENUM('ACTING','PERMANENT'), defaultValue: 'PERMANENT'},
  licenseNumber: DataTypes.STRING(100),
  licenseExpiry: DataTypes.DATEONLY,
  aadhaarLast4: DataTypes.STRING(4),
  documents: {
    type: DataTypes.JSON, defaultValue: {},
    get() { return jsonObject(this.getDataValue('documents')); },
  },
  verification: {type: DataTypes.ENUM('NOT_SUBMITTED','PENDING','APPROVED','REJECTED'), defaultValue: 'NOT_SUBMITTED'},
  verificationNote: DataTypes.TEXT,
  verifiedBy: DataTypes.INTEGER.UNSIGNED,
  homeLat: DataTypes.DOUBLE,
  homeLng: DataTypes.DOUBLE,
  available: {type: DataTypes.BOOLEAN, defaultValue: false},
  salaryType: {type: DataTypes.ENUM('MONTHLY','DAILY','PER_TRIP','HOURLY'),defaultValue:'MONTHLY'},
  salaryRate: {type: DataTypes.DECIMAL(12,2), defaultValue:0},
  ...driverOnboardingFields,
  documentFiles: {
    ...driverOnboardingFields.documentFiles,
    get() { return jsonObject(this.getDataValue('documentFiles')); },
  }
 }, { sequelize, modelName: 'DriverProfile', tableName: 'driver_profiles' });
 return DriverProfile;
};
