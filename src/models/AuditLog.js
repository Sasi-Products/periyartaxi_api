import _pkg_sequelize from "sequelize";
const { Model, DataTypes } = _pkg_sequelize;
class AuditLog extends Model {}
export default (sequelize) => {
 AuditLog.init({
  actorId: DataTypes.INTEGER.UNSIGNED,
  action: {type:DataTypes.STRING(120),allowNull:false},
  entity: DataTypes.STRING(80),
  entityId: DataTypes.STRING(80),
  before: DataTypes.JSON,
  after: DataTypes.JSON,
  ip: DataTypes.STRING(64)
 }, { sequelize, modelName: 'AuditLog', tableName: 'audit_logs' });
 return AuditLog;
};
