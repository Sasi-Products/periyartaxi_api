import bcrypt from 'bcryptjs';
import SequelizePkg from 'sequelize';
const { Op } = SequelizePkg;
import {
  sequelize, Branch, User, DriverProfile, DriverShift, DriverLocation,
} from '../models/index.js';
import { wrap, fail, positive, num } from '../utils/http.js';
import { mobile } from '../utils/validate.js';
import { branchGuard } from '../middleware/auth.js';
import { audit } from '../services/audit.js';
import {
  REQUIRED_DRIVER_DOCS, DRIVER_DOC_KEYS, saveDriverDocuments,
  removeDriverDocuments, driverDocumentLinks, sendDriverDocument,
} from '../services/driverFiles.js';

const salaryTypes = ['MONTHLY', 'DAILY', 'PER_TRIP', 'HOURLY'];
const employmentKinds = ['PERMANENT', 'ACTING'];
const text = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const optional = (v, max = 200) => text(v, max) || null;
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

function date(v, key, required = false) {
  if (!v) {
    if (required) fail(400, `${key} required`);
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v + 'T00:00:00Z')) ||
    new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) !== v) fail(400, `Invalid ${key}`);
  return v;
}
function address(value, required = false) {
  let item = value;
  if (typeof item === 'string') {
    try { item = JSON.parse(item); } catch { fail(400, 'Invalid address JSON'); }
  }
  if (item == null || item === '') {
    if (required) fail(400, 'Permanent address is required');
    return null;
  }
  if (typeof item !== 'object' || Array.isArray(item)) fail(400, 'Invalid address');
  const result = {
    line1: text(item.line1, 180), line2: optional(item.line2, 180),
    city: text(item.city, 100), district: text(item.district, 100),
    state: text(item.state || 'Tamil Nadu', 100), pincode: text(item.pincode, 6),
  };
  if (required && (!result.line1 || !result.city || !result.district || !result.state || !/^\d{6}$/.test(result.pincode))) {
    fail(400, 'Complete permanent address and 6-digit pincode required');
  }
  if (!required && Object.values(result).every((v) => !v)) return null;
  if (!result.line1 || !result.city || !result.district || !/^\d{6}$/.test(result.pincode)) {
    fail(400, 'Complete temporary address or leave it blank');
  }
  return result;
}
function selectedProfileFields(body, { isDriver = false } = {}) {
  const fields = [
    'licenseNumber','licenseExpiry','aadhaarLast4','homeLat','homeLng',
    'email','dateOfBirth','joinedOn','experienceYears','licenseClasses',
    'permanentAddress','temporaryAddress','emergencyName','emergencyMobile',
    'emergencyRelation','bloodGroup','languages','referenceName','referenceMobile',
    'onboardingNote','backgroundCheckStatus','backgroundCheckDate',
    'kind','salaryType','salaryRate',
  ];
  const selfRestricted = ['backgroundCheckStatus','backgroundCheckDate','onboardingNote','kind','salaryType','salaryRate','joinedOn'];
  const result = {};
  for (const field of fields) {
    if (body[field] === undefined || (isDriver && selfRestricted.includes(field))) continue;
    const v = body[field];
    if (['permanentAddress','temporaryAddress'].includes(field)) result[field] = address(v, field === 'permanentAddress');
    else if (['licenseExpiry','dateOfBirth','joinedOn','backgroundCheckDate'].includes(field)) result[field] = date(v, field);
    else if (field === 'aadhaarLast4') {
      if (v && !/^\d{4}$/.test(String(v))) fail(400, 'Aadhaar: last four digits only');
      result[field] = v || null;
    } else if (['homeLat','homeLng','experienceYears','salaryRate'].includes(field)) {
      if (v === '' || v == null) result[field] = null;
      else result[field] = num(v, field);
    } else if (['emergencyMobile','referenceMobile'].includes(field)) result[field] = v ? mobile(v) : null;
    else if (field === 'salaryType') {
      if (!salaryTypes.includes(v)) fail(400, 'Invalid salary type');
      result[field] = v;
    } else if (field === 'kind') {
      if (!employmentKinds.includes(v)) fail(400, 'Invalid employment type');
      result[field] = v;
    } else if (field === 'backgroundCheckStatus') {
      if (!['NOT_STARTED','PENDING','CLEARED','FLAGGED'].includes(v)) fail(400, 'Invalid background check status');
      result[field] = v;
    } else result[field] = optional(v, field === 'onboardingNote' ? 2000 : 160);
  }
  if (result.experienceYears != null && result.experienceYears > 75) fail(400, 'Invalid driving experience');
  if (result.homeLat != null && result.homeLat > 90) fail(400, 'Invalid home latitude');
  if (result.homeLng != null && result.homeLng > 180) fail(400, 'Invalid home longitude');
  if (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) fail(400, 'Invalid email address');
  if (result.licenseExpiry && result.licenseExpiry < today()) fail(400, 'Driving license has expired');
  return result;
}
async function findDriver(req, param = req.params.id) {
  const userId = param === 'me' ? req.user.id : positive(param, 'driver ID');
  const user = await User.findByPk(userId);
  if (!user || user.role !== 'DRIVER') fail(404, 'Driver not found');
  if (req.user.role === 'DRIVER') {
    if (user.id !== req.user.id) fail(403, 'Access denied');
  } else {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) fail(403, 'Access denied');
    if (req.user.role === 'ADMIN' && !Array.isArray(req.user.permissions)) fail(403, 'Missing drivers.manage permission');
    if (req.user.role === 'ADMIN' && !req.user.permissions.includes('drivers.manage')) fail(403, 'Missing drivers.manage permission');
    branchGuard(req, user.branchId);
  }
  const profile = await DriverProfile.findOne({ where: { userId } });
  if (!profile) fail(404, 'Driver profile missing');
  return { user, profile };
}

export const list = wrap(async (req, res) => {
  const where = { role: 'DRIVER' };
  if (req.user.role === 'ADMIN') where.branchId = req.user.branchId;
  else if (req.query.branchId) where.branchId = positive(req.query.branchId);
  const users = await User.findAll({ where, attributes: { exclude: ['passwordHash'] }, order: [['id', 'DESC']] });
  const profiles = await DriverProfile.findAll({ where: { userId: { [Op.in]: users.map((user) => user.id) } } });
  const lookup = new Map(profiles.map((p) => [p.userId, p.toJSON()]));
  res.json(users.map((user) => ({ ...user.toJSON(), profile: lookup.get(user.id) || null })));
});
export const profile = wrap(async (req, res) => {
  const { user, profile: p } = await findDriver(req, req.user.role === 'DRIVER' ? 'me' : req.params.id);
  const safe = user.toJSON(); delete safe.passwordHash;
  res.json({ user: safe, profile: p });
});

// One transaction creates login and driver profile, and private files are cleaned up if it fails.
export const onboard = wrap(async (req, res) => {
  const body = req.body;
  const name = text(body.name, 140);
  const username = text(body.username, 80);
  const password = String(body.password || '');
  if (name.length < 3) fail(400, 'Driver full name required');
  if (!/^[a-zA-Z][a-zA-Z0-9_.-]{3,39}$/.test(username)) fail(400, 'Username must contain 4–40 letters, numbers, dots, underscores or hyphens');
  if (password.length < 12 || password.length > 128) fail(400, 'Temporary password must contain 12–128 characters');
  const driverMobile = mobile(body.mobile);
  const branchId = positive(body.branchId, 'branch ID');
  branchGuard(req, branchId);
  const branch = await Branch.findByPk(branchId);
  if (!branch?.active) fail(400, 'Choose an active branch');
  const kind = body.kind || 'PERMANENT';
  if (!employmentKinds.includes(kind)) fail(400, 'Invalid employment type');
  const values = selectedProfileFields(body);
  if (!values.permanentAddress) fail(400, 'Permanent address required');
  if (!values.emergencyName || !values.emergencyMobile || !values.emergencyRelation) fail(400, 'Emergency contact, mobile and relationship are required');
  if (!values.licenseNumber || !values.licenseExpiry) fail(400, 'Driving license number and expiry required');
  if (!values.joinedOn) fail(400, 'Joining date required');
  if (!values.dateOfBirth || values.dateOfBirth > new Date(Date.now() - 18 * 365.2425 * 86400000).toISOString().slice(0, 10)) {
    fail(400, 'Driver must be at least 18; verify commercial driving eligibility separately');
  }
  if (!values.aadhaarLast4 || !/^\d{4}$/.test(values.aadhaarLast4)) fail(400, 'Only last four Aadhaar digits required');
  const hasRequiredDocs = REQUIRED_DRIVER_DOCS.every((key) => req.files?.[key]?.length);
  let createdUserId = null;
  let stored = {};
  let result;
  try {
    result = await sequelize.transaction(async (transaction) => {
      const user = await User.create({
        name, username, mobile: driverMobile, branchId, role: 'DRIVER', active: true,
        passwordHash: await bcrypt.hash(password, 12), mustChangePassword: true,
        permissions: [],
      }, { transaction });
      createdUserId = user.id;
      stored = await saveDriverDocuments(req.files, user.id);
      const profileData = {
        ...values, userId: user.id, kind, available: false,
        employeeCode: `PTD-${String(user.id).padStart(5, '0')}`,
        salaryType: values.salaryType || 'MONTHLY', salaryRate: values.salaryRate ?? 0,
        documents: driverDocumentLinks(user.id, stored), documentFiles: stored,
        verification: hasRequiredDocs ? 'PENDING' : 'NOT_SUBMITTED',
      };
      const driver = await DriverProfile.create(profileData, { transaction });
      return { user, driver };
    });
  } catch (error) {
    if (createdUserId) await removeDriverDocuments(createdUserId, stored);
    throw error;
  }
  await audit(req, 'DRIVER_ONBOARDED', 'DriverProfile', result.driver.id, null, {
    driverId: result.user.id, branchId, kind, employeeCode: result.driver.employeeCode,
  });
  res.status(201).json({
    message: 'Driver created. Share temporary credentials securely; driver must change password at first login.',
    id: result.user.id, name: result.user.name, username: result.user.username,
    employeeCode: result.driver.employeeCode,
    verification: result.driver.verification,
    uploadedDocuments: Object.keys(stored),
  });
});

export const updateProfile = wrap(async (req, res) => {
  const { profile: p } = await findDriver(req, req.user.role === 'DRIVER' ? 'me' : req.params.id);
  const fields = selectedProfileFields(req.body, { isDriver: req.user.role === 'DRIVER' });
  if (req.body.documents !== undefined) {
    // Retained for older driver app's own upload workflow. No arbitrary external URLs.
    const docs = req.body.documents;
    if (!docs || typeof docs !== 'object' || Array.isArray(docs)) fail(400, 'Invalid documents');
    for (const [key, value] of Object.entries(docs)) {
      if (!DRIVER_DOC_KEYS.includes(key) || !/^\/api\/uploads\/user_\d+_[a-f0-9]{32}\.(jpg|png|webp|pdf)$/.test(value)) fail(400, 'Invalid uploaded document URL');
      const owner = Number(value.split('_')[1]);
      if (owner !== req.user.id) fail(403, 'Document must belong to uploading account');
    }
    fields.documents = { ...(p.documents || {}), ...docs };
  }
  const sensitiveUpdate = ['licenseNumber', 'licenseExpiry', 'aadhaarLast4', 'documents'].some((key) => fields[key] !== undefined);
  if (sensitiveUpdate) Object.assign(fields, { verification: 'NOT_SUBMITTED', available: false });
  await p.update(fields);
  await audit(req, 'DRIVER_PROFILE_UPDATED', 'DriverProfile', p.id, null, { fields: Object.keys(fields) });
  res.json(p);
});

export const uploadDocuments = wrap(async (req, res) => {
  const { profile: p, user } = await findDriver(req, req.params.id || 'me');
  if (!Object.keys(req.files || {}).length) fail(400, 'Select at least one document');
  const stored = await saveDriverDocuments(req.files, user.id);
  const previous = p.documentFiles || {};
  const next = { ...previous, ...stored };
  const docs = { ...(p.documents || {}), ...driverDocumentLinks(user.id, stored) };
  try {
    await p.update({ documentFiles: next, documents: docs, verification: 'NOT_SUBMITTED', available: false });
  } catch (error) { await removeDriverDocuments(user.id, stored); throw error; }
  await removeDriverDocuments(user.id, Object.fromEntries(Object.keys(stored).filter((k) => previous[k]).map((k) => [k, previous[k]])));
  await audit(req, 'DRIVER_DOCUMENTS_UPLOADED', 'DriverProfile', p.id, null, { categories: Object.keys(stored) });
  res.json({ message: 'Private documents saved; submit for verification', documents: docs });
});

export const viewDocument = wrap(async (req, res) => {
  const { profile: p, user } = await findDriver(req, req.params.id);
  const key = req.params.key;
  if (!DRIVER_DOC_KEYS.includes(key)) fail(404, 'Document not found');
  const filename = p.documentFiles?.[key];
  if (!filename) fail(404, 'Private document not found');
  await sendDriverDocument(res, user.id, filename);
});

function hasDocuments(p) {
  return REQUIRED_DRIVER_DOCS.every((key) => !!p.documents?.[key]);
}
export const submit = wrap(async (req, res) => {
  const { profile: p } = await findDriver(req, req.params.id || 'me');
  if (!p.licenseNumber || !p.aadhaarLast4 || !hasDocuments(p)) fail(422, 'Driving license, masked Aadhaar and photo are required');
  if (!p.licenseExpiry || p.licenseExpiry < today()) fail(422, 'Valid driving license expiry is required');
  await p.update({ verification: 'PENDING', available: false });
  await audit(req, 'DRIVER_VERIFICATION_SUBMITTED', 'DriverProfile', p.id);
  res.json(p);
});
export const verify = wrap(async (req, res) => {
  const { profile: p } = await findDriver(req);
  const approved = req.body.approved === true;
  if (approved) {
    if (p.verification !== 'PENDING') fail(422, 'Driver must submit documents before approval');
    if (!p.licenseNumber || !p.licenseExpiry || p.licenseExpiry < today() || !p.aadhaarLast4 || !hasDocuments(p)) {
      fail(422, 'Valid license, masked Aadhaar and driver photo are required');
    }
    if (p.backgroundCheckStatus === 'FLAGGED') fail(422, 'Resolve flagged background check before approval');
  }
  await p.update({
    verification: approved ? 'APPROVED' : 'REJECTED',
    verifiedBy: req.user.id,
    verificationNote: text(req.body.note, 500),
    available: false,
  });
  await audit(req, 'DRIVER_VERIFICATION', 'DriverProfile', p.id, null, { approved });
  res.json(p);
});
export const availability = wrap(async (req, res) => {
  const p = await DriverProfile.findOne({ where: { userId: req.user.id } });
  if (!p || p.verification !== 'APPROVED') fail(403, 'Driver is not approved');
  const shift = await DriverShift.findOne({ where: { driverId: req.user.id, active: true }, order: [['id', 'DESC']] });
  if (!shift) fail(422, 'Clock in before marking available');
  await p.update({ available: !!req.body.available });
  res.json({ available: p.available });
});
export const live = wrap(async (req, res) => {
  const branchId = req.user.role === 'ADMIN' ? req.user.branchId : req.query.branchId;
  const where = branchId ? { branchId: positive(branchId) } : {};
  const rows = await DriverLocation.findAll({ where });
  res.json(rows.filter((x) => Date.now() - new Date(x.reportedAt).getTime() < Number(process.env.LOCATION_STALE_SECONDS || 120) * 1000));
});
