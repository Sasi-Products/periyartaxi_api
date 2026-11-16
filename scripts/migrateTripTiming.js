import '../src/config/env.js';
import { sequelize, RideOtp, RideGpsSample, RideWaitInterval } from '../src/models/index.js';
try {
  await sequelize.authenticate();
  // Additive only. Never sync all historical models with alter:true / force:true.
  for (const model of [RideOtp, RideGpsSample, RideWaitInterval]) {
    const table = model.getTableName();
    const tables = await sequelize.getQueryInterface().showAllTables();
    const names = tables.map(t => typeof t === 'string' ? t : t.tableName || t.name);
    if (!names.includes(table)) await model.sync();
    console.log(`${table}: ready`);
  }
  console.log('Trip verification/timing migration complete. Existing rides preserved.');
} catch (e) { console.error(e); process.exitCode = 1; }
finally { await sequelize.close(); }
