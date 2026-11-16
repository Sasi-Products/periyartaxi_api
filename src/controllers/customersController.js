import Sequelize from 'sequelize';
import { sequelize, User, CustomerProfile, Ride } from '../models/index.js';
import { wrap, fail, positive } from '../utils/http.js';
import { mobile as checkMobile } from '../utils/validate.js';
import { audit } from '../services/audit.js';
import { scopedCustomer, customerRideScope, branchCustomerIds, findCustomerByPhone, sameMobile } from '../services/customerAccess.js';
const { Op, fn, col, literal } = Sequelize;

const clean = (value, max = 250) => String(value ?? '').trim().slice(0, max);
const pageArgs = query => ({ page: Math.max(1, Math.min(10000, Number.parseInt(query.page, 10) || 1)), pageSize: Math.max(1, Math.min(100, Number.parseInt(query.pageSize, 10) || 20)) });
const safeUser = row => ({ id: row.id, name: row.name, mobile: row.mobile, active: row.active, createdAt: row.createdAt });
const optionalMobile = value => clean(value) ? checkMobile(value) : null;
const summaryAttrs = [
  'customerId',
  [fn('COUNT', col('id')), 'totalRides'],
  [fn('SUM', literal("CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END")), 'completedRides'],
  [fn('SUM', literal("CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END")), 'cancelledRides'],
  [fn('SUM', literal("CASE WHEN status = 'COMPLETED' THEN COALESCE(final_fare, estimated_fare, 0) ELSE 0 END")), 'completedFare']
];
const rideSummary = rows => ({ totalRides: Number(rows?.totalRides || 0), completedRides: Number(rows?.completedRides || 0), cancelledRides: Number(rows?.cancelledRides || 0), completedFare: Number(rows?.completedFare || 0) });

export const list = wrap(async (req, res) => {
  const { page, pageSize } = pageArgs(req.query);
  const search = clean(req.query.q, 100);
  const source = clean(req.query.source, 20);
  const branchId = req.user.role === 'ADMIN' ? Number(req.user.branchId) : (req.query.branchId ? positive(req.query.branchId, 'branch ID') : null);
  if (req.user.role === 'ADMIN' && (!Number.isSafeInteger(branchId) || branchId < 1)) fail(403, 'Admin branch is not configured');
  const where = { role: 'CUSTOMER' };
  if (search) where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { mobile: { [Op.like]: `%${search}%` } }];
  if (branchId) where.id = { [Op.in]: await branchCustomerIds(branchId) };
  if (source && source !== 'ALL') {
    if (!['APP', 'ADMIN', 'SUPER_ADMIN', 'LEGACY'].includes(source)) fail(400, 'Invalid customer source');
    const profiles = await CustomerProfile.findAll({ where: { createdVia: source }, attributes: ['userId'], raw: true });
    const filtered = new Set(profiles.map(p => Number(p.userId)));
    if (branchId) where.id[Op.in] = where.id[Op.in].filter(id => filtered.has(Number(id)));
    else where.id = { [Op.in]: [...filtered] };
  }
  const { count, rows } = await User.findAndCountAll({ where, attributes: ['id', 'name', 'mobile', 'active', 'createdAt'], order: [['id', 'DESC']], limit: pageSize, offset: (page - 1) * pageSize });
  const ids = rows.map(row => row.id);
  const [profiles, summaries] = await Promise.all([
    CustomerProfile.findAll({ where: { userId: { [Op.in]: ids } } }),
    ids.length ? Ride.findAll({ where: { customerId: { [Op.in]: ids }, ...(branchId ? { branchId } : {}) }, attributes: summaryAttrs, group: ['customerId'], raw: true }) : []
  ]);
  const profilesById = new Map(profiles.map(profile => [Number(profile.userId), profile]));
  const summaryById = new Map(summaries.map(row => [Number(row.customerId), rideSummary(row)]));
  res.json({ rows: rows.map(user => ({ ...safeUser(user), profile: profilesById.get(user.id) || null, summary: summaryById.get(user.id) || rideSummary() })), total: count, page, pageSize });
});

export const lookup = wrap(async (req, res) => {
  const m = checkMobile(req.query.mobile);
  const customer = await findCustomerByPhone(m);
  if (!customer || customer.role !== 'CUSTOMER' || !customer.active) fail(404, 'Customer not found for this exact phone number');
  await audit(req, 'CUSTOMER_LOOKUP', 'User', customer.id, null, { source: 'exact_phone' });
  res.json(safeUser(customer));
});

export const create = wrap(async (req, res) => {
  const name = clean(req.body.name, 140);
  if (name.length < 2) fail(400, 'Customer name must have at least 2 characters');
  const m = optionalMobile(req.body.mobile);
  const branchId = req.user.role === 'ADMIN' ? Number(req.user.branchId) : positive(req.body.branchId, 'branch ID');
  if (!Number.isSafeInteger(branchId) || branchId < 1) fail(403, 'Select a valid branch before creating a customer');
  const customerType = req.body.customerType === 'BUSINESS' ? 'BUSINESS' : 'INDIVIDUAL';
  if (m && await findCustomerByPhone(m)) fail(409, 'Mobile number already registered. Select the existing customer instead of creating a duplicate.');
  const row = await sequelize.transaction(async t => {
    const user = await User.create({ name, mobile: m, role: 'CUSTOMER', branchId: null, active: true }, { transaction: t });
    await CustomerProfile.create({ userId: user.id, branchId, createdVia: req.user.role, createdBy: req.user.id, customerType, address: clean(req.body.address, 1500) || null, notes: clean(req.body.notes, 2000) || null, alternateMobile: optionalMobile(req.body.alternateMobile), preferredLanguage: ['TAMIL', 'ENGLISH', 'OTHER'].includes(req.body.preferredLanguage) ? req.body.preferredLanguage : 'TAMIL' }, { transaction: t });
    return user;
  });
  await audit(req, 'CUSTOMER_CREATED', 'User', row.id, null, { name: row.name, mobile: !!row.mobile, branchId });
  res.status(201).json({ customer: safeUser(row), id: row.id });
});

export const one = wrap(async (req, res) => {
  const { user, profile } = await scopedCustomer(req, req.params.id);
  const where = customerRideScope(req, user.id);
  const [summary] = await Ride.findAll({ where, attributes: summaryAttrs, group: ['customerId'], raw: true });
  const recentRides = await Ride.findAll({ where, order: [['id', 'DESC']], limit: 6, attributes: { exclude: ['startOtpHash'] } });
  res.json({ ...safeUser(user), profile, summary: rideSummary(summary), recentRides });
});

export const update = wrap(async (req, res) => {
  const { user, profile } = await scopedCustomer(req, req.params.id, 'manage');
  const name = req.body.name === undefined ? undefined : clean(req.body.name, 140);
  if (name !== undefined && name.length < 2) fail(400, 'Customer name must have at least 2 characters');
  const changes = {};
  for (const k of ['notes', 'address']) if (req.body[k] !== undefined) changes[k] = clean(req.body[k], k === 'notes' ? 2000 : 1500);
  if (req.body.alternateMobile !== undefined) changes.alternateMobile = optionalMobile(req.body.alternateMobile);
  if (req.body.customerType !== undefined) {
    if (!['BUSINESS', 'INDIVIDUAL'].includes(req.body.customerType)) fail(400, 'Invalid customer type');
    changes.customerType = req.body.customerType;
  }
  if (req.body.preferredLanguage !== undefined) {
    if (!['TAMIL', 'ENGLISH', 'OTHER'].includes(req.body.preferredLanguage)) fail(400, 'Invalid language');
    changes.preferredLanguage = req.body.preferredLanguage;
  }
  // Never let staff alter an OTP login mobile from an unverified CRM edit.
  await sequelize.transaction(async t => {
    if (name !== undefined) await user.update({ name }, { transaction: t });
    if (profile) await profile.update(changes, { transaction: t });
    else await CustomerProfile.create({ userId: user.id, branchId: req.user.branchId || null, createdVia: 'LEGACY', ...changes }, { transaction: t });
  });
  await audit(req, 'CUSTOMER_UPDATED', 'User', user.id, null, { ...changes, name });
  res.json({ message: 'Customer updated' });
});

export const rides = wrap(async (req, res) => {
  const { user } = await scopedCustomer(req, req.params.id);
  const { page, pageSize } = pageArgs(req.query);
  const where = customerRideScope(req, user.id);
  const mode = clean(req.query.mode, 20) || 'all';
  const history = ['COMPLETED', 'CANCELLED', 'NO_DRIVER'];
  if (mode === 'history') where.status = { [Op.in]: history };
  else if (mode === 'active') where.status = { [Op.notIn]: history };
  else if (mode !== 'all') fail(400, 'Invalid ride list mode');
  if (req.query.service) where.service = clean(req.query.service, 32);
  if (req.query.status) where.status = clean(req.query.status, 32);
  const { count, rows } = await Ride.findAndCountAll({ where, attributes: { exclude: ['startOtpHash'] }, order: [['id', 'DESC']], limit: pageSize, offset: (page - 1) * pageSize });
  res.json({ rows, total: count, page, pageSize });
});

export const unlinked = wrap(async (req, res) => {
  const { page, pageSize } = pageArgs(req.query);
  const where = { customerId: null, [Op.or]: [{ guestName: { [Op.ne]: null } }, { guestMobile: { [Op.ne]: null } }] };
  if (req.user.role === 'ADMIN') where.branchId = req.user.branchId;
  else if (req.query.branchId) where.branchId = positive(req.query.branchId, 'branch ID');
  const { count, rows } = await Ride.findAndCountAll({ where, attributes: ['id', 'branchId', 'service', 'guestName', 'guestMobile', 'status', 'scheduledAt', 'estimatedFare', 'finalFare', 'pickupAddress', 'dropoffAddress'], order: [['id', 'DESC']], limit: pageSize, offset: (page - 1) * pageSize });
  res.json({ rows, total: count, page, pageSize });
});

export const linkRide = wrap(async (req, res) => {
  const { user } = await scopedCustomer(req, req.params.id, 'manage');
  const ride = await Ride.findByPk(positive(req.body.rideId, 'ride ID'));
  if (!ride || (req.user.role === 'ADMIN' && Number(ride.branchId) !== Number(req.user.branchId))) fail(404, 'Ride not found');
  if (ride.customerId) fail(409, 'This ride already belongs to a customer');
  if (ride.guestMobile && user.mobile && !sameMobile(ride.guestMobile, user.mobile)) fail(409, 'Guest and customer phone numbers differ. Do not merge records without verification.');
  const [changed] = await Ride.update({ customerId: user.id }, { where: { id: ride.id, customerId: null } });
  if (!changed) fail(409, 'Ride was linked by another operator');
  await audit(req, 'CUSTOMER_RIDE_LINKED', 'Ride', ride.id, null, { customerId: user.id });
  res.json({ message: 'Booking linked to customer', rideId: ride.id, customerId: user.id });
});
