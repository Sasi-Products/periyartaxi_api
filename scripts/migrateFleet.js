import SequelizePkg from 'sequelize';
import { sequelize, Vehicle, VehicleServiceLog, VehicleOdometerLog } from '../src/models/index.js';

// Idempotent additive migration: do not drop or recreate existing vehicle/ride data.
async function migrate() {
  await sequelize.authenticate();
  const qi = sequelize.getQueryInterface();
  const existing = await qi.describeTable('vehicles');
  for (const [attribute, definition] of Object.entries(Vehicle.rawAttributes)) {
    if (['id', 'createdAt', 'updatedAt'].includes(attribute)) continue;
    const column = attribute.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    if (existing[column]) continue;
    // sequelize's physical column mapping; Sequelize adds an enum type definition correctly in MySQL.
    await qi.addColumn('vehicles', column, {
      type: definition.type,
      allowNull: definition.allowNull !== false,
      defaultValue: definition.defaultValue,
    });
    console.log(`Added vehicles.${column}`);
  }
  await VehicleServiceLog.sync();
  await VehicleOdometerLog.sync();
  console.log('Fleet migration complete. No existing records were deleted.');
}
try { await migrate(); } catch (error) { console.error(error); process.exitCode = 1; }
finally { await sequelize.close(); }
