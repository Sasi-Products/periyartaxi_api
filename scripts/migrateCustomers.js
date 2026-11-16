import { sequelize, User, CustomerProfile } from '../src/models/index.js';

// Additive-only: creates customer_profiles if absent; never drops users, rides or pricing.
try {
  await sequelize.authenticate();
  await CustomerProfile.sync();
  const users = await User.findAll({ where: { role: 'CUSTOMER' }, attributes: ['id'], raw: true });
  const existing = await CustomerProfile.findAll({ attributes: ['userId'], raw: true });
  const known = new Set(existing.map(row => Number(row.userId)));
  const missing = users.filter(user => !known.has(Number(user.id)));
  if (missing.length) {
    await CustomerProfile.bulkCreate(missing.map(user => ({ userId: user.id, createdVia: 'LEGACY' })), { ignoreDuplicates: true });
  }
  console.log(`Customer migration complete: ${missing.length} existing customer profiles added; no rides or users removed.`);
} catch (error) {
  console.error('Customer migration failed:', error);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
