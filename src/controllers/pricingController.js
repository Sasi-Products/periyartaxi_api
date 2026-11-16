import { PricingRule, LocalPackage, Branch } from '../models/index.js';
import { wrap, fail, positive, num } from '../utils/http.js';
import { validateConfig, SERVICES, DEFAULTS } from '../services/fare.js';
import { audit } from '../services/audit.js';
import { branchGuard } from '../middleware/auth.js';

function readConfig(value) {
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { return {}; }
  }
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
const configByService = (service, config) => {
  const parsed = readConfig(config);
  return { ...DEFAULTS[service], ...Object.fromEntries(Object.entries(parsed).filter(([key]) => key in DEFAULTS[service])) };
};
export const list = wrap(async (req, res) => {
  const branchId = positive(req.query.branchId || req.user.branchId, 'branch ID');
  branchGuard(req, branchId);
  const rows = await PricingRule.findAll({ where: { branchId } });
  res.json(SERVICES.map(service => {
    const row = rows.find(r => r.service === service);
    return { service, branchId, config: configByService(service, row?.config), version: row?.version || 0 };
  }));
});
export const save = wrap(async (req, res) => {
  const branchId = positive(req.body.branchId, 'branch ID');
  const service = req.body.service;
  branchGuard(req, branchId);
  if (!await Branch.findByPk(branchId)) fail(404, 'Branch not found');
  if (!SERVICES.includes(service)) fail(400, 'Choose a valid taxi service');
  const config = validateConfig(service, req.body.config);
  const rule = await PricingRule.findOne({ where: { branchId, service } });
  const before = rule?.config || null;
  const saved = rule ? await rule.update({ config, version: rule.version + 1, active: true }) : await PricingRule.create({ branchId, service, config });
  await audit(req, 'PRICING_UPDATED', 'PricingRule', saved.id, before, config);
  res.json({ ...saved.toJSON(), config });
});
export const packages = wrap(async (req, res) => {
  const branchId = positive(req.query.branchId || req.user.branchId, 'branch ID');
  branchGuard(req, branchId);
  res.json(await LocalPackage.findAll({ where: { branchId }, order: [['hours', 'ASC'], ['kms', 'ASC']] }));
});
function validatePackage(body) {
  if (!String(body.name || '').trim()) fail(400, 'Package name is required');
  for (const f of ['hours', 'kms', 'baseFare', 'extraHour', 'extraKm']) num(body[f], f);
  if (Number(body.hours) <= 0 || Number(body.kms) <= 0) fail(400, 'Package duration and kilometres must be greater than zero');
}
const packageFields = body => Object.fromEntries(['name', 'hours', 'kms', 'baseFare', 'extraHour', 'extraKm', 'active'].filter(k => body[k] !== undefined).map(k => [k, k === 'name' ? String(body[k]).trim().slice(0, 120) : body[k]]));
export const addPackage = wrap(async (req, res) => {
  const branchId = positive(req.body.branchId, 'branch ID');
  branchGuard(req, branchId);
  validatePackage(req.body);
  const pkg = await LocalPackage.create({ ...packageFields(req.body), branchId });
  await audit(req, 'PACKAGE_CREATED', 'LocalPackage', pkg.id);
  res.status(201).json(pkg);
});
export const editPackage = wrap(async (req, res) => {
  const pkg = await LocalPackage.findByPk(positive(req.params.id));
  if (!pkg) fail(404, 'Package not found');
  branchGuard(req, pkg.branchId);
  validatePackage({ ...pkg.toJSON(), ...req.body });
  await pkg.update(packageFields(req.body));
  await audit(req, 'PACKAGE_UPDATED', 'LocalPackage', pkg.id);
  res.json(pkg);
});
