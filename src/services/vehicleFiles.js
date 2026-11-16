import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { fail } from '../utils/http.js';

export const VEHICLE_MEDIA = Object.freeze({
  photos: ['front', 'back', 'left', 'right', 'interior1', 'interior2'],
  videos: ['walkaround', 'interior', 'engine'],
  documents: ['rc', 'insurance', 'permit', 'pollution', 'fitness', 'roadTax', 'ownerKyc', 'attachmentAgreement', 'ownerConsent', 'purchaseInvoice', 'serviceInvoice'],
});
const STORAGE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads/vehicle-private');
const EXTENSIONS = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp',
  'application/pdf': '.pdf', 'video/mp4': '.mp4', 'video/webm': '.webm',
};
const MAX_BYTES = 25 * 1024 * 1024;
export const vehicleMediaUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 1 }, fileFilter(_req, file, cb) {
  if (!EXTENSIONS[file.mimetype]) return cb(Object.assign(new Error('Allowed: JPG, PNG, WebP, PDF, MP4, WebM'), { status: 400 }));
  cb(null, true);
}}).single('file');

export function validateMediaKey(group, key) {
  if (!VEHICLE_MEDIA[group]?.includes(key)) fail(400, 'Invalid vehicle media category');
}
function isCorrectFile(buffer, mime) {
  if (mime === 'image/jpeg') return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (mime === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
  if (mime === 'image/webp') return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (mime === 'application/pdf') return buffer.subarray(0, 5).toString() === '%PDF-';
  if (mime === 'video/mp4') return buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp';
  if (mime === 'video/webm') return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  return false;
}
const vehicleDir = id => path.join(STORAGE, String(Number(id)));
export async function storeVehicleMedia(id, group, key, file) {
  validateMediaKey(group, key);
  if (!file) fail(400, 'Select a file');
  if (group === 'videos' && !file.mimetype.startsWith('video/')) fail(400, 'Select an MP4 or WebM video');
  if (group === 'photos' && !file.mimetype.startsWith('image/')) fail(400, 'Select a photo');
  if (group === 'documents' && file.mimetype.startsWith('video/')) fail(400, 'Documents cannot be videos');
  if (!isCorrectFile(file.buffer, file.mimetype)) fail(400, 'File content does not match its type');
  const folder = vehicleDir(id);
  await fs.mkdir(folder, { recursive: true, mode: 0o700 });
  const name = crypto.randomBytes(24).toString('hex') + EXTENSIONS[file.mimetype];
  await fs.writeFile(path.join(folder, name), file.buffer, { flag: 'wx', mode: 0o600 });
  return name;
}
export async function deleteVehicleMedia(id, filename) {
  if (!/^[a-f0-9]{48}\.(jpg|png|webp|pdf|mp4|webm)$/.test(filename || '')) return;
  await fs.unlink(path.join(vehicleDir(id), filename)).catch(() => {});
}
export async function sendVehicleMedia(res, id, filename) {
  if (!/^[a-f0-9]{48}\.(jpg|png|webp|pdf|mp4|webm)$/.test(filename || '')) fail(404, 'File not found');
  const absolute = path.join(vehicleDir(id), filename);
  try { await fs.access(absolute); } catch { fail(404, 'File not found'); }
  res.set('Cache-Control', 'private, no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Content-Security-Policy', 'sandbox');
  const ext = path.extname(filename);
  const mime = Object.entries(EXTENSIONS).find(([, value]) => value === ext)?.[0] || 'application/octet-stream';
  res.type(mime);
  // Documents are downloaded; images/videos may preview in an authenticated fetch/blob.
  res.set('Content-Disposition', `attachment; filename="periyar-vehicle${ext}"`);
  res.sendFile(absolute);
}
