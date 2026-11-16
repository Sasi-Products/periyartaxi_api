// Friendly diagnostics for first-time installation.
const required = ['express','sequelize','mysql2','cors','helmet','express-rate-limit',
  'bcryptjs','jsonwebtoken','firebase-admin','razorpay','socket.io','zod','multer'];
const missing = required.filter((name) => {
  try { import.meta.resolve(name); return false; } catch { return true; }
});
if (missing.length) {
  console.error('\nPeriyar Taxi Backend: required dependencies are missing.');
  console.error('Missing: ' + missing.join(', '));
  console.error('Fix: open the backend folder, then run: npm install');
  console.error('After installation: npm run db:init; npm run db:seed; npm run dev\n');
  process.exitCode = 1;
} else {
  console.log('Backend dependencies found.');
}
