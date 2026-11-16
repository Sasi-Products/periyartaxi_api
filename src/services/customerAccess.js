import Sequelize from 'sequelize';
import { CustomerProfile, Ride, User } from '../models/index.js';
import { fail, positive } from '../utils/http.js';
import { normalizedPhone, sameMobile, phoneVariants } from '../utils/customerPhone.js';
export { normalizedPhone, sameMobile } from '../utils/customerPhone.js';
const { Op } = Sequelize;

export async function scopedCustomer(req, id, action = 'view') {
  const user = await User.findByPk(positive(id, 'customer ID'));
  if (!user || user.role !== 'CUSTOMER') fail(404, 'Customer not found');
  const profile = await CustomerProfile.findOne({ where: { userId: user.id } });
  if (req.user.role === 'ADMIN') {
    const branchId = Number(req.user.branchId);
    const inProfile = Number(profile?.branchId) === branchId;
    const inTrips = await Ride.count({ where: { branchId, customerId: user.id } });
    if (!inProfile && !inTrips) fail(404, 'Customer not found for your branch');
    if (action === 'manage' && !inProfile && !inTrips) fail(403, 'Customer is outside your branch');
  }
  return { user, profile };
}

export function customerRideScope(req, customerId) {
  return { customerId, ...(req.user.role === 'ADMIN' ? { branchId: req.user.branchId } : {}) };
}

export async function branchCustomerIds(branchId) {
  const [profiles, rides] = await Promise.all([
    CustomerProfile.findAll({ where: { branchId }, attributes: ['userId'], raw: true }),
    Ride.findAll({ where: { branchId, customerId: { [Op.ne]: null } }, attributes: ['customerId'], group: ['customerId'], raw: true })
  ]);
  return [...new Set([...profiles.map(r => r.userId), ...rides.map(r => r.customerId)].map(Number).filter(Boolean))];
}

export async function findCustomerByPhone(value) {
  const variants = phoneVariants(value);
  if (!variants.length) return null;
  const matched = await User.findAll({ where: { mobile: { [Op.in]: variants } }, attributes: ['id', 'name', 'mobile', 'role', 'active'], limit: 3 });
  if (matched.length > 1) fail(409, 'Multiple accounts share equivalent phone formats. Resolve duplicate identities before booking.');
  return matched[0] || null;
}
