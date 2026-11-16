import { sequelize, Branch, Vehicle, VehicleServiceLog, VehicleOdometerLog, Expense } from '../models/index.js';
import { wrap, fail, positive, num } from '../utils/http.js';
import { branchGuard } from '../middleware/auth.js';
import { audit } from '../services/audit.js';
import { storeVehicleMedia, sendVehicleMedia, deleteVehicleMedia, validateMediaKey } from '../services/vehicleFiles.js';

const VEHICLE_TYPES = ['MINI', 'SEDAN', 'SUV', 'SUV_PLUS'];
const OWNERSHIP = ['COMPANY', 'ATTACHED'];
const STATUS = ['AVAILABLE', 'MAINTENANCE', 'RETIRED'];
const PHOTO_KEYS = ['front', 'back', 'left', 'right', 'interior1', 'interior2'];
const REQUIRED_DOCS = ['rc', 'insurance', 'permit', 'pollution'];
const TEXT_FIELDS = ['registration', 'brand', 'name', 'variant', 'fuelType', 'chassisLast6', 'engineLast6', 'insuranceProvider', 'policyNumber', 'notes'];
const NUM_FIELDS = ['modelYear', 'seats', 'odometerKm', 'serviceDueKm'];
const DATE_FIELDS = ['registrationDate', 'insuranceExpiry', 'pollutionExpiry', 'permitExpiry', 'fitnessExpiry', 'roadTaxExpiry', 'serviceDueDate', 'lastServiceAt'];
const clean = (value, max = 200) => String(value ?? '').trim().slice(0, max);
const today = () => new Date().toISOString().slice(0, 10);
function validDate(value, label) {
  if (value == null || value === '') return null;
  const s = String(value);
  const parsed = new Date(`${s}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== s) fail(400, `Invalid ${label}`);
  return s;
}
function sanitize(input, { create = false } = {}) {
  const body = {};
  for (const f of TEXT_FIELDS) if (input[f] !== undefined) body[f] = clean(input[f], f === 'notes' ? 3000 : 180);
  for (const f of NUM_FIELDS) if (input[f] !== undefined) body[f] = input[f] === '' || input[f] == null ? null : num(input[f], f);
  for (const f of DATE_FIELDS) if (input[f] !== undefined) body[f] = validDate(input[f], f);
  if (input.type !== undefined) { if (!VEHICLE_TYPES.includes(input.type)) fail(400, 'Invalid vehicle category'); body.type = input.type; }
  if (input.ownershipType !== undefined) { if (!OWNERSHIP.includes(input.ownershipType)) fail(400, 'Ownership must be COMPANY or ATTACHED'); body.ownershipType = input.ownershipType; }
  if (input.vehicleStatus !== undefined) { if (!STATUS.includes(input.vehicleStatus)) fail(400, 'Invalid availability status'); body.vehicleStatus = input.vehicleStatus; }
  if (input.active !== undefined) body.active = input.active === true;
  if (input.ownerDetails !== undefined) {
    const o = input.ownerDetails;
    if (!o || typeof o !== 'object' || Array.isArray(o)) fail(400, 'Invalid owner details');
    body.ownerDetails = Object.fromEntries(['name', 'mobile', 'alternateMobile', 'address', 'city', 'state', 'pincode', 'relation'].map(k => [k, clean(o[k])]).filter(([, v]) => v));
  }
  if (input.attachmentTerms !== undefined) {
    const o = input.attachmentTerms;
    if (!o || typeof o !== 'object' || Array.isArray(o)) fail(400, 'Invalid attachment terms');
    body.attachmentTerms = {
      startDate: validDate(o.startDate, 'agreement start date'),
      endDate: validDate(o.endDate, 'agreement end date'),
      settlementType: ['PER_TRIP', 'DAILY', 'MONTHLY', 'PERCENTAGE'].includes(o.settlementType) ? o.settlementType : 'PER_TRIP',
      settlementRate: o.settlementRate === '' || o.settlementRate == null ? 0 : num(o.settlementRate, 'settlement rate'),
      notes: clean(o.notes, 900),
    };
    if (body.attachmentTerms.endDate && body.attachmentTerms.startDate && body.attachmentTerms.endDate < body.attachmentTerms.startDate) fail(400, 'Agreement end date precedes start date');
    if (body.attachmentTerms.settlementType === 'PERCENTAGE' && body.attachmentTerms.settlementRate > 100) fail(400, 'Percentage must be 0–100');
  }
  if (create && !body.registration) fail(400, 'Registration number required');
  if (body.registration) body.registration = body.registration.toUpperCase().replace(/\s+/g, ' ');
  if (body.modelYear != null && (body.modelYear < 1980 || body.modelYear > new Date().getFullYear() + 1)) fail(400, 'Invalid model year');
  if (body.seats != null && (!Number.isInteger(body.seats) || body.seats < 2 || body.seats > 25)) fail(400, 'Invalid seat capacity');
  if (body.chassisLast6 && !/^[a-z0-9]{6}$/i.test(body.chassisLast6)) fail(400, 'Chassis last 6 must contain 6 characters');
  if (body.engineLast6 && !/^[a-z0-9]{6}$/i.test(body.engineLast6)) fail(400, 'Engine last 6 must contain 6 characters');
  return body;
}
function checkOwnership(data) {
  if (data.ownershipType === 'ATTACHED') {
    if (!data.ownerDetails?.name || !/^\d{10}$/.test(data.ownerDetails?.mobile || '')) fail(400, 'Attached vehicle requires owner name and 10-digit mobile');
    if (!data.ownerDetails?.address) fail(400, 'Attached vehicle requires owner address');
    if (!data.attachmentTerms?.startDate) fail(400, 'Attached vehicle requires agreement start date');
  }
}
async function findScoped(req, id) {
  const v = await Vehicle.findByPk(positive(id, 'vehicle ID'));
  if (!v) fail(404, 'Vehicle not found');
  branchGuard(req, v.branchId);
  return v;
}
export const list = wrap(async (req, res) => {
  const branchId = req.user.role === 'ADMIN' ? req.user.branchId : req.query.branchId;
  const where = branchId ? { branchId: positive(branchId, 'branch ID') } : {};
  res.json(await Vehicle.findAll({ where, order: [['id', 'DESC']] }));
});
export const get = wrap(async (req, res) => res.json(await findScoped(req, req.params.id)));
export const add = wrap(async (req, res) => {
  const branchId = positive(req.body.branchId, 'branch ID'); branchGuard(req, branchId);
  if (!await Branch.findByPk(branchId)) fail(404, 'Branch not found');
  const data = sanitize(req.body, { create: true });
  data.branchId = branchId;
  if (!data.type) fail(400, 'Vehicle category required');
  if (!data.ownershipType) data.ownershipType = 'COMPANY';
  checkOwnership(data);
  if (data.ownershipType === 'COMPANY') { data.ownerDetails = {}; data.attachmentTerms = {}; }
  // New vehicles always start unverified; media is uploaded through a protected endpoint.
  data.verification = 'PENDING';
  const v = await Vehicle.create(data);
  if (Number(data.odometerKm) > 0) await VehicleOdometerLog.create({ vehicleId: v.id, branchId, readingKm: data.odometerKm, readingAt: new Date(), source: 'INSPECTION', note: 'Registration opening reading', createdBy: req.user.id });
  await audit(req, 'VEHICLE_CREATED', 'Vehicle', v.id);
  res.status(201).json(v);
});
export const update = wrap(async (req, res) => {
  const v = await findScoped(req, req.params.id);
  const data = sanitize(req.body);
  // Vehicle odometer can only advance through the audited reading endpoint.
  if (data.odometerKm !== undefined) fail(400, 'Use the odometer reading endpoint');
  const next = { ...v.toJSON(), ...data };
  checkOwnership(next);
  if (next.ownershipType === 'COMPANY') { data.ownerDetails = {}; data.attachmentTerms = {}; }
  if (data.ownershipType !== undefined && data.ownershipType !== v.ownershipType) data.verification = 'PENDING';
  if (['ownerDetails', 'attachmentTerms', 'registrationDate', 'insuranceExpiry', 'pollutionExpiry', 'permitExpiry', 'fitnessExpiry', 'roadTaxExpiry'].some(field => data[field] !== undefined)) data.verification = 'PENDING';
  await v.update(data);
  await audit(req, 'VEHICLE_UPDATED', 'Vehicle', v.id);
  res.json(v);
});
export const verify = wrap(async (req, res) => {
  const v = await findScoped(req, req.params.id);
  if (req.body.approved === true) {
    if (!PHOTO_KEYS.every(k => v.photos?.[k]) || !REQUIRED_DOCS.every(k => v.documents?.[k])) fail(422, 'Upload all 6 vehicle photos and RC, insurance, permit, pollution documents');
    checkOwnership(v.toJSON());
    if (v.ownershipType === 'ATTACHED' && !['ownerKyc', 'attachmentAgreement', 'ownerConsent'].every(k => v.documents?.[k])) fail(422, 'Attached vehicles require owner proof, attachment agreement and consent document');
    // Expiry dates prevent approving knowingly expired certificates.
    for (const k of ['insuranceExpiry', 'pollutionExpiry', 'permitExpiry', 'fitnessExpiry']) if (v[k] && v[k] < today()) fail(422, `${k} has expired`);
  }
  await v.update({ verification: req.body.approved === true ? 'APPROVED' : 'REJECTED' });
  await audit(req, 'VEHICLE_VERIFICATION', 'Vehicle', v.id);
  res.json(v);
});
export const uploadMedia = wrap(async (req, res) => {
  const v = await findScoped(req, req.params.id);
  const { group, key } = req.params;
  validateMediaKey(group, key);
  const saved = await storeVehicleMedia(v.id, group, key, req.file);
  const previous = v[group]?.[key];
  try {
    await v.update({ [group]: { ...(v[group] || {}), [key]: saved }, verification: 'PENDING' });
  } catch (error) { await deleteVehicleMedia(v.id, saved); throw error; }
  // Remove the previous internal file only. Historic legacy URL strings are kept intact.
  await deleteVehicleMedia(v.id, previous);
  await audit(req, 'VEHICLE_MEDIA_UPLOADED', 'Vehicle', v.id, null, { group, key });
  res.status(201).json({ vehicle: v, url: `/api/vehicles/${v.id}/media/${group}/${key}` });
});
export const readMedia = wrap(async (req, res) => {
  const v = await findScoped(req, req.params.id);
  const { group, key } = req.params;
  validateMediaKey(group, key);
  const saved = v[group]?.[key];
  if (!saved) fail(404, 'File missing');
  if (String(saved).startsWith('/api/uploads/')) return res.redirect(307, saved); // legacy authenticated files
  return sendVehicleMedia(res, v.id, saved);
});
export const odometerHistory = wrap(async (req, res) => {
  const v = await findScoped(req, req.params.id);
  res.json(await VehicleOdometerLog.findAll({ where: { vehicleId: v.id }, order: [['readingAt', 'DESC'], ['id', 'DESC']], limit: 300 }));
});
export const addOdometer = wrap(async (req, res) => {
  const v = await findScoped(req, req.params.id);
  const km = num(req.body.readingKm, 'odometer km');
  if (km < Number(v.odometerKm || 0)) fail(409, 'Reading cannot be less than the current odometer');
  const note = clean(req.body.note, 500);
  const entry = await sequelize.transaction(async transaction => {
    const locked = await Vehicle.findByPk(v.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (km < Number(locked.odometerKm || 0)) fail(409, 'Reading cannot be less than the current odometer');
    const log = await VehicleOdometerLog.create({ vehicleId: v.id, branchId: v.branchId, readingKm: km, readingAt: new Date(), source: 'MANUAL', note, createdBy: req.user.id }, { transaction });
    await locked.update({ odometerKm: km }, { transaction });
    return log;
  });
  await audit(req, 'VEHICLE_ODOMETER_RECORDED', 'Vehicle', v.id, null, { km });
  res.status(201).json(entry);
});
export const serviceHistory = wrap(async (req, res) => {
  const v = await findScoped(req, req.params.id);
  res.json(await VehicleServiceLog.findAll({ where: { vehicleId: v.id }, order: [['serviceDate', 'DESC'], ['id', 'DESC']], limit: 300 }));
});
export const addService = wrap(async (req, res) => {
  const v = await findScoped(req, req.params.id);
  const serviceDate = validDate(req.body.serviceDate, 'service date');
  if (!serviceDate || serviceDate > today()) fail(400, 'Service date must be today or earlier');
  const category = clean(req.body.category, 60);
  const description = clean(req.body.description, 3000);
  if (!category || !description) fail(400, 'Service category and description are required');
  const partsCost = num(req.body.partsCost || 0, 'parts cost');
  const labourCost = num(req.body.labourCost || 0, 'labour cost');
  const odometerKm = req.body.odometerKm === '' || req.body.odometerKm == null ? null : num(req.body.odometerKm, 'service odometer');
  const nextServiceKm = req.body.nextServiceKm === '' || req.body.nextServiceKm == null ? null : num(req.body.nextServiceKm, 'next service km');
  const nextServiceDate = validDate(req.body.nextServiceDate, 'next service date');
  const saved = await sequelize.transaction(async transaction => {
    const locked = await Vehicle.findByPk(v.id, { transaction, lock: transaction.LOCK.UPDATE });
    let expense = null;
    if (req.body.addToExpenses === true && partsCost + labourCost > 0) {
      expense = await Expense.create({ branchId: v.branchId, vehicleId: v.id, category: 'VEHICLE_SERVICE', description, amount: partsCost + labourCost, expenseDate: serviceDate, createdBy: req.user.id }, { transaction });
    }
    const entry = await VehicleServiceLog.create({ vehicleId: v.id, branchId: v.branchId, serviceDate, category, workshop: clean(req.body.workshop, 180), description, odometerKm, partsCost, labourCost, totalCost: partsCost + labourCost, nextServiceKm, nextServiceDate, expenseId: expense?.id || null, createdBy: req.user.id }, { transaction });
    const changes = {};
    if (odometerKm != null && odometerKm > Number(locked.odometerKm || 0)) {
      changes.odometerKm = odometerKm;
      await VehicleOdometerLog.create({ vehicleId: v.id, branchId: v.branchId, readingKm: odometerKm, readingAt: new Date(), source: 'SERVICE', note: `Service log #${entry.id}`, createdBy: req.user.id }, { transaction });
    }
    if (!locked.lastServiceAt || serviceDate >= locked.lastServiceAt) {
      changes.lastServiceAt = serviceDate;
      if (nextServiceKm != null) changes.serviceDueKm = nextServiceKm;
      if (nextServiceDate != null) changes.serviceDueDate = nextServiceDate;
    }
    if (Object.keys(changes).length) await locked.update(changes, { transaction });
    return entry;
  });
  await audit(req, 'VEHICLE_SERVICE_RECORDED', 'VehicleServiceLog', saved.id);
  res.status(201).json(saved);
});

export const uploadServiceInvoice = wrap(async (req, res) => {
  const v = await findScoped(req, req.params.id);
  const log = await VehicleServiceLog.findOne({ where: { id: positive(req.params.logId, 'service ID'), vehicleId: v.id } });
  if (!log) fail(404, 'Service record not found');
  const saved = await storeVehicleMedia(v.id, 'documents', 'serviceInvoice', req.file);
  const previous = log.invoiceDocument;
  try { await log.update({ invoiceDocument: saved }); }
  catch (error) { await deleteVehicleMedia(v.id, saved); throw error; }
  await deleteVehicleMedia(v.id, previous);
  await audit(req, 'VEHICLE_SERVICE_INVOICE', 'VehicleServiceLog', log.id);
  res.status(201).json({ url: `/api/vehicles/${v.id}/services/${log.id}/invoice` });
});
export const readServiceInvoice = wrap(async (req, res) => {
  const v = await findScoped(req, req.params.id);
  const log = await VehicleServiceLog.findOne({ where: { id: positive(req.params.logId, 'service ID'), vehicleId: v.id } });
  if (!log?.invoiceDocument) fail(404, 'Service invoice not found');
  return sendVehicleMedia(res, v.id, log.invoiceDocument);
});
