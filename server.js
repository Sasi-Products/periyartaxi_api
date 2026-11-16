import './src/config/env.js';
import http from 'node:http';
import app from './src/index.js';
import { sequelize } from './src/models/index.js';
import { configure } from './src/services/socket.js';
import { start as startDispatchWorker } from './src/workers/dispatchWorker.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes('REPLACE_WITH')) {
  throw new Error('Set JWT_SECRET to a secure random value of at least 32 characters');
}
if (process.env.NODE_ENV === 'production' && process.env.OTP_DEV_MODE === 'true') {
  throw new Error('Disable OTP_DEV_MODE in production');
}
const server = http.createServer(app);
configure(server);
try {
  await sequelize.authenticate();
  console.log('MySQL connected');
  server.listen(Number(process.env.PORT || 8080), () => console.log(`Periyar Taxi API on port ${process.env.PORT || 8080}`));
  startDispatchWorker();
} catch (error) {
  console.error('Startup failed:', error);
  process.exitCode = 1;
}
