/**
 * Periyar Taxi demo-media installer (ES modules, Node >= 22)
 * Run from your existing backend root AFTER SQL import:
 *    node scripts/installDemoMedia.js
 * Copies only visibly fictional demo assets to protected uploads folders and updates only
 * pt demo records. Re-running will reuse existing files (no duplicate media rows).
 */
import '../src/config/env.js';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sequelize, User, DriverProfile, Vehicle, VehicleServiceLog } from '../src/models/index.js';
import { knownKeys } from '../src/utils/jsonObject.js';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = path.join(backendRoot, 'demo_assets');
const driverRoot = path.join(backendRoot, 'uploads', 'driver-private');
const vehicleRoot = path.join(backendRoot, 'uploads', 'vehicle-private');
const driverKeys = [
  'photo', 'license', 'licenseBack', 'aadhaar', 'aadhaarBack',
  'addressProof', 'policeVerification', 'medicalCertificate',
  'experienceProof', 'qualificationProof', 'bankProof', 'signedAgreement',
];
const photoKeys = ['front', 'back', 'left', 'right', 'interior1', 'interior2'];
const videoKeys = ['walkaround', 'interior', 'engine'];
const normalDocs = ['rc', 'insurance', 'permit', 'pollution', 'fitness', 'roadTax', 'purchaseInvoice'];
const attachedDocs = ['ownerKyc', 'attachmentAgreement', 'ownerConsent'];

const filesCreated = [];
function safePath(id, kind) {
  if (!Number.isSafeInteger(Number(id)) || Number(id) < 1) throw new Error('Unsafe ID');
  return path.join(kind === 'driver' ? driverRoot : vehicleRoot, String(id));
}
async function installFile(from, dir, oldName, extension, hexLength) {
  if (oldName && new RegExp(`^[a-f0-9]{${hexLength}}\\.${extension}$`).test(oldName)) {
    try { await fs.access(path.join(dir, oldName)); return oldName; } catch { /* copy again */ }
  }
  await fs.access(from);
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  const filename = randomBytes(hexLength / 2).toString('hex') + '.' + extension;
  const destination = path.join(dir, filename);
  await fs.copyFile(from, destination, fs.constants.COPYFILE_EXCL);
  await fs.chmod(destination, 0o600);
  filesCreated.push(destination);
  return filename;
}

async function installDriver(tag) {
  const username = `ptdemo_driver_${tag.slice(1)}`;
  const user = await User.findOne({ where: { username, role: 'DRIVER' } });
  if (!user) throw Error(`Demo SQL has not been imported (missing ${username})`);
  if (user.active || user.passwordHash) throw Error(`Refusing to modify active or password-enabled ${username}`);
  const profile = await DriverProfile.findOne({ where: { userId: user.id } });
  if (!profile) throw Error(`Driver profile missing for ${username}`);
  const dir = safePath(user.id, 'driver');
  const old = knownKeys(profile.documentFiles, driverKeys);
  const stored = { ...old };
  const links = knownKeys(profile.documents, driverKeys);
  for (const key of driverKeys) {
    const source = path.join(assets, 'drivers', tag, `${key}.png`);
    stored[key] = await installFile(source, dir, old[key], 'png', 40);
    links[key] = `/api/drivers/${user.id}/documents/${key}`;
  }
  await profile.update({ documentFiles: stored, documents: links, verification: 'PENDING', available: false });
  console.log(`Driver media installed: ${username}, ${driverKeys.length} document categories`);
}

async function installVehicle(tag, registration) {
  const vehicle = await Vehicle.findOne({ where: { registration } });
  if (!vehicle) throw Error(`Demo SQL has not been imported (missing ${registration})`);
  if (vehicle.active) throw Error(`Refusing to modify an active demo vehicle: ${registration}`);
  const dir = safePath(vehicle.id, 'vehicle');
  const photos = knownKeys(vehicle.photos, photoKeys);
  const docKeys = [...normalDocs, ...(vehicle.ownershipType === 'ATTACHED' ? attachedDocs : [])];
  const docs = knownKeys(vehicle.documents, docKeys);
  const videos = knownKeys(vehicle.videos, videoKeys);
  const dirAsset = path.join(assets, 'vehicles', tag);
  for (const key of photoKeys) {
    photos[key] = await installFile(path.join(dirAsset, 'photos', `${key}.png`), dir, photos[key], 'png', 48);
  }
  for (const key of docKeys) {
    docs[key] = await installFile(path.join(dirAsset, 'documents', `${key}.png`), dir, docs[key], 'png', 48);
  }
  for (const key of videoKeys) {
    videos[key] = await installFile(path.join(dirAsset, 'videos', `${key}.mp4`), dir, videos[key], 'mp4', 48);
  }
  await vehicle.update({ photos, documents: docs, videos, verification: 'PENDING', active: false });
  const sampleInvoice = await VehicleServiceLog.findOne({
    where: { vehicleId: vehicle.id, category: 'DEMO_OIL_CHANGE' }, order: [['id', 'ASC']],
  });
  if (sampleInvoice) {
    const invoice = await installFile(
      path.join(dirAsset, 'service_invoice.png'), dir, sampleInvoice.invoiceDocument, 'png', 48,
    );
    await sampleInvoice.update({ invoiceDocument: invoice });
  }
  console.log(`Vehicle media installed: ${registration}, 6 photos, ${Object.keys(docs).length} documents, 3 videos`);
}

async function main() {
  const check = await fs.stat(assets).catch(() => null);
  if (!check?.isDirectory()) throw Error('Missing demo_assets. Extract the full demo ZIP into your backend root first.');
  await sequelize.authenticate();
  for (const tag of ['d1', 'd2', 'd3', 'd4']) await installDriver(tag);
  for (const [tag, registration] of [
    ['v1', 'DEMO-TN33-SEDAN'], ['v2', 'DEMO-TN33-MINI'],
    ['v3', 'DEMO-TN33-SUV'], ['v4', 'DEMO-TN36-SEDAN'],
  ]) await installVehicle(tag, registration);
  console.log('Success. Sample media stored privately. All demo driver accounts and vehicles remain disabled for real dispatch.');
}
try { await main(); }
catch (error) {
  console.error('Demo media installation failed:', error?.message || error);
  console.error('Re-run after correcting the problem; the installation is idempotent.');
  process.exitCode = 1;
} finally { await sequelize.close(); }
