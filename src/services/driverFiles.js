import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { fail } from '../utils/http.js';

export const DRIVER_DOC_KEYS = [
  'photo', 'license', 'licenseBack', 'aadhaar', 'aadhaarBack',
  'addressProof', 'policeVerification', 'medicalCertificate',
  'experienceProof', 'qualificationProof', 'bankProof', 'signedAgreement',
];
export const REQUIRED_DRIVER_DOCS = ['photo', 'license', 'aadhaar'];

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads/driver-private');
const TYPES = {
  'image/jpeg': '.jpg', 'image/png': '.png',
  'image/webp': '.webp', 'application/pdf': '.pdf',
};
const maxSize = 5 * 1024 * 1024;

export const driverDocumentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { files: DRIVER_DOC_KEYS.length, fileSize: maxSize, fields: 45, fieldSize: 20000 },
  fileFilter(_req, file, callback) {
    if (!TYPES[file.mimetype] || (file.fieldname === 'photo' && !file.mimetype.startsWith('image/'))) {
      return callback(Object.assign(new Error('Only JPG, PNG, WebP and PDF documents are supported (photo must be an image)'), { status: 400 }));
    }
    callback(null, true);
  },
}).fields(DRIVER_DOC_KEYS.map((name) => ({ name, maxCount: 1 })));

function matchesMagic(buffer, type) {
  if (type === 'image/jpeg') return buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (type === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
  if (type === 'image/webp') return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (type === 'application/pdf') return buffer.length >= 5 && buffer.toString('ascii', 0, 5) === '%PDF-';
  return false;
}

function driverDirectory(driverId) {
  if (!Number.isSafeInteger(Number(driverId)) || Number(driverId) <= 0) fail(400, 'Invalid driver ID');
  return path.join(ROOT, String(driverId));
}

export async function saveDriverDocuments(files = {}, driverId) {
  const dir = driverDirectory(driverId);
  const saved = {};
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  try {
    for (const [key, list] of Object.entries(files)) {
      if (!DRIVER_DOC_KEYS.includes(key)) fail(400, 'Unknown document category');
      const file = list?.[0];
      if (!file) continue;
      if (!matchesMagic(file.buffer, file.mimetype)) fail(400, `Invalid ${key} file contents`);
      const name = crypto.randomBytes(20).toString('hex') + TYPES[file.mimetype];
      await fs.writeFile(path.join(dir, name), file.buffer, { flag: 'wx', mode: 0o600 });
      saved[key] = name;
    }
    return saved;
  } catch (error) {
    await removeDriverDocuments(driverId, saved);
    throw error;
  }
}

export function driverDocumentLinks(driverId, saved) {
  return Object.fromEntries(Object.keys(saved).map((key) => [key, `/api/drivers/${driverId}/documents/${key}`]));
}

export async function removeDriverDocuments(driverId, saved = {}) {
  const dir = driverDirectory(driverId);
  await Promise.all(Object.values(saved).map(async (name) => {
    if (/^[a-f0-9]{40}\.(jpg|png|webp|pdf)$/.test(name)) {
      await fs.unlink(path.join(dir, name)).catch(() => {});
    }
  }));
}

export async function sendDriverDocument(res, driverId, filename) {
  if (!/^[a-f0-9]{40}\.(jpg|png|webp|pdf)$/.test(filename || '')) fail(404, 'Document unavailable');
  const absolute = path.join(driverDirectory(driverId), filename);
  try { await fs.access(absolute); } catch { fail(404, 'Document unavailable'); }
  const extension = path.extname(filename).toLowerCase();
  const contentType = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.pdf': 'application/pdf' }[extension];
  res.set('Cache-Control', 'private, no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Content-Security-Policy', 'sandbox');
  res.set('Content-Disposition', `attachment; filename="driver-document${extension}"`);
  res.type(contentType);
  res.sendFile(absolute);
}
