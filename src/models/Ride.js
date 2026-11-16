import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class Ride extends Model {}
const jsonValue = name => ({
  type: DataTypes.JSON,
  defaultValue: {},
  get() {
    const value=this.getDataValue(name);
    if(typeof value==='string'){try{return JSON.parse(value)}catch{return {}}}
    return value && typeof value==='object' ? value : {};
  },
});
export default (sequelize) => {
 Ride.init({
  branchId: {type: DataTypes.INTEGER.UNSIGNED,allowNull:false},
  customerId: DataTypes.INTEGER.UNSIGNED,
  guestName: DataTypes.STRING(140),
  guestMobile: DataTypes.STRING(20),
  service: {type: DataTypes.STRING(32),allowNull:false},
  tripMode: {type: DataTypes.ENUM('ONE_WAY','ROUND_TRIP'),defaultValue:'ONE_WAY'},
  packageId: DataTypes.INTEGER.UNSIGNED,
  vehicleType: DataTypes.STRING(40),
  requiredDrivers: {type: DataTypes.INTEGER, defaultValue:1},
  pickup: {type: DataTypes.JSON,allowNull:false},
  dropoff: DataTypes.JSON,
  pickupAddress: DataTypes.TEXT,
  dropoffAddress: DataTypes.TEXT,
  distanceKm: DataTypes.FLOAT,
  durationMinutes: DataTypes.FLOAT,
  scheduledAt: DataTypes.DATE,
  returnAt: DataTypes.DATE,
  status: {type: DataTypes.ENUM('REQUESTED','SEARCHING','OFFERED','ASSIGNED','ARRIVING','IN_PROGRESS','COMPLETED','CANCELLED','NO_DRIVER'),defaultValue:'REQUESTED'},
  assignedDriverId: DataTypes.INTEGER.UNSIGNED,
  vehicleId: DataTypes.INTEGER.UNSIGNED,
  quote: jsonValue('quote'),
  estimatedFare: {type: DataTypes.DECIMAL(12,2),defaultValue:0},
  finalFare: DataTypes.DECIMAL(12,2),
  paymentStatus: {type: DataTypes.ENUM('UNPAID','PARTIAL','PAID'),defaultValue:'UNPAID'},
  startOtpHash: DataTypes.STRING(255),
  startedAt: DataTypes.DATE,
  endedAt: DataTypes.DATE,
  cancelledAt: DataTypes.DATE,
  cancelReason: DataTypes.TEXT,
  createdBy: DataTypes.INTEGER.UNSIGNED,
  notes: DataTypes.TEXT,
  metadata: jsonValue('metadata')
 }, { sequelize, modelName: 'Ride', tableName: 'rides' });
 return Ride;
};
