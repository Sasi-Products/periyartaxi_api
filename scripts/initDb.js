import { sequelize } from "../src/models/index.js";


(async()=>{await sequelize.authenticate();await sequelize.sync();console.log('Database schema initialized. For production, use reviewed migrations and backups before schema changes.');await sequelize.close()})().catch(e=>{console.error(e);process.exit(1)});
