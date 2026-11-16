import SequelizePkg from 'sequelize';
const { DataTypes } = SequelizePkg;

// Defined once so model and additive migration use the same column types.
export const driverOnboardingFields = {
  employeeCode: { type: DataTypes.STRING(24), allowNull: true, unique: true },
  email: { type: DataTypes.STRING(160), allowNull: true },
  dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
  joinedOn: { type: DataTypes.DATEONLY, allowNull: true },
  experienceYears: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
  licenseClasses: { type: DataTypes.STRING(150), allowNull: true },
  permanentAddress: { type: DataTypes.JSON, allowNull: true },
  temporaryAddress: { type: DataTypes.JSON, allowNull: true },
  emergencyName: { type: DataTypes.STRING(140), allowNull: true },
  emergencyMobile: { type: DataTypes.STRING(20), allowNull: true },
  emergencyRelation: { type: DataTypes.STRING(60), allowNull: true },
  bloodGroup: { type: DataTypes.STRING(12), allowNull: true },
  languages: { type: DataTypes.STRING(160), allowNull: true },
  referenceName: { type: DataTypes.STRING(140), allowNull: true },
  referenceMobile: { type: DataTypes.STRING(20), allowNull: true },
  backgroundCheckStatus: { type: DataTypes.ENUM('NOT_STARTED','PENDING','CLEARED','FLAGGED'), defaultValue: 'NOT_STARTED' },
  backgroundCheckDate: { type: DataTypes.DATEONLY, allowNull: true },
  onboardingNote: { type: DataTypes.TEXT, allowNull: true },
  documentFiles: { type: DataTypes.JSON, allowNull: true },
};
