import { jsonObject } from '../utils/jsonObject.js';
import SequelizePkg from 'sequelize';
const { Model, DataTypes } = SequelizePkg;

class Vehicle extends Model {}
// Return structured JSON even if mysql2/Sequelize supplied a serialized string.
const objectField = (name) => ({
  type: DataTypes.JSON,
  defaultValue: {},
  get() { return jsonObject(this.getDataValue(name)); },
});
export default (sequelize) => {
  Vehicle.init({
    branchId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    registration: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    brand: DataTypes.STRING(80),
    name: DataTypes.STRING(100),
    variant: DataTypes.STRING(100),
    modelYear: DataTypes.INTEGER,
    fuelType: DataTypes.STRING(60),
    seats: DataTypes.INTEGER,
    type: { type: DataTypes.STRING(40), allowNull: false },
    ownershipType: { type: DataTypes.ENUM('COMPANY', 'ATTACHED'), allowNull: false, defaultValue: 'COMPANY' },
    ownerDetails: objectField('ownerDetails'),
    attachmentTerms: objectField('attachmentTerms'),
    chassisLast6: DataTypes.STRING(6),
    engineLast6: DataTypes.STRING(6),
    registrationDate: DataTypes.DATEONLY,
    insuranceExpiry: DataTypes.DATEONLY,
    pollutionExpiry: DataTypes.DATEONLY,
    permitExpiry: DataTypes.DATEONLY,
    fitnessExpiry: DataTypes.DATEONLY,
    roadTaxExpiry: DataTypes.DATEONLY,
    odometerKm: { type: DataTypes.FLOAT, defaultValue: 0 },
    serviceDueKm: DataTypes.FLOAT,
    serviceDueDate: DataTypes.DATEONLY,
    lastServiceAt: DataTypes.DATEONLY,
    vehicleStatus: { type: DataTypes.ENUM('AVAILABLE', 'MAINTENANCE', 'RETIRED'), defaultValue: 'AVAILABLE' },
    insuranceProvider: DataTypes.STRING(120),
    policyNumber: DataTypes.STRING(100),
    notes: DataTypes.TEXT,
    photos: objectField('photos'),
    documents: objectField('documents'),
    videos: objectField('videos'),
    verification: { type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'), defaultValue: 'PENDING' },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { sequelize, modelName: 'Vehicle', tableName: 'vehicles' });
  return Vehicle;
};
