/** Reports existing pricing rule validity. READ-ONLY. */
import '../src/config/env.js';
import { sequelize, Branch, PricingRule } from '../src/models/index.js';
import { SERVICES, DEFAULTS, validateConfig } from '../src/services/fare.js';

function decode(raw) {
  let value = raw;
  for (let i = 0; i < 2 && typeof value === 'string'; i++) {
    try { value = JSON.parse(value); } catch { break; }
  }
  return value;
}
try {
  await sequelize.authenticate();
  const branches = await Branch.findAll({ order: [['id', 'ASC']] });
  for (const branch of branches) {
    console.log(`\nBranch ${branch.name} [${branch.code}] (ID ${branch.id})`);
    for (const service of SERVICES) {
      const record = await PricingRule.findOne({ where: { branchId: branch.id, service, active: true } });
      if (!record) { console.log(`  ${service}: MISSING (default values would be used)`); continue; }
      const raw = record.config;
      const config = decode(raw);
      try {
        validateConfig(service, config);
        console.log(`  ${service}: OK (version ${record.version})`);
      } catch (e) {
        console.log(`  ${service}: INVALID - ${e.message} (stored type ${typeof raw})`);
      }
    }
  }
  console.log('\nThis script did not edit any data.');
  console.log('If all rules are OK but saving fares says "Invalid pricing rule", inspect the frontend POST/PUT request config object.');
} catch (error) {
  console.error('Pricing diagnostic error:', error);
  process.exitCode = 1;
} finally { await sequelize.close(); }
