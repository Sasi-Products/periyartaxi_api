import SequelizePkg from 'sequelize';
import { sequelize } from '../src/models/index.js';
import { driverOnboardingFields } from '../src/models/driverOnboardingFields.js';
const { DataTypes } = SequelizePkg;

async function migrate() {
  await sequelize.authenticate();
  const qi = sequelize.getQueryInterface();
  const users = await qi.describeTable('users');
  if (!users.must_change_password) {
    await qi.addColumn('users', 'must_change_password', {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    });
    console.log('Added users.must_change_password');
  }
  const existing = await qi.describeTable('driver_profiles');
  for (const [attribute, definition] of Object.entries(driverOnboardingFields)) {
    const column = attribute.replace(/[A-Z]/g, (letter) => '_' + letter.toLowerCase());
    if (!existing[column]) {
      await qi.addColumn('driver_profiles', column, definition);
      console.log('Added driver_profiles.' + column);
    }
  }
  console.log('Driver onboarding additive migration complete');
}
migrate().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => sequelize.close());
