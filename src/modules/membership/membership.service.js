import { Membership } from './membership.model.js';
import { AppError } from '../../utils/appError.js';

export const getUserMemberships = async (userId) => {
  return await Membership.find({ userId, status: { $ne: 'REMOVED' } })
    .populate('organizationId', 'name plan subscriptionStatus ownerId')
    .sort({ createdAt: -1 })
    .lean();
};

export const getActiveMembershipContext = async (userId, orgId) => {
  const membership = await Membership.findOne({
    userId,
    organizationId: orgId,
    status: 'ACTIVE',
  })
    .populate('organizationId', 'name plan subscriptionStatus ownerId')
    .lean();

  if (!membership) {
    throw new AppError('Active membership not found for this organization', 404);
  }

  return membership;
};

export const leaveOrganization = async (userId, orgId) => {
  const membership = await Membership.findOne({ userId, organizationId: orgId, status: 'ACTIVE' });

  if (!membership) {
    throw new AppError('Active membership not found', 404);
  }

  if (membership.role === 'OWNER') {
    throw new AppError('Organization owners cannot leave. You must transfer ownership first or delete the organization.', 400);
  }

  membership.status = 'REMOVED';
  await membership.save();
  return membership;
};

export const removeMemberFromOrg = async (orgId, targetMemberId, operatorRole) => {
  const targetMembership = await Membership.findOne({
    _id: targetMemberId,
    organizationId: orgId,
    status: { $ne: 'REMOVED' },
  });

  if (!targetMembership) {
    throw new AppError('Member not found in this organization', 404);
  }

  if (targetMembership.role === 'OWNER') {
    throw new AppError('Cannot remove the organization owner', 400);
  }

  // Prevent MANAGER from removing another MANAGER or OWNER
  if (operatorRole === 'MANAGER' && ['OWNER', 'MANAGER'].includes(targetMembership.role)) {
    throw new AppError('Managers can only remove HR and Staff members', 403);
  }

  targetMembership.status = 'REMOVED';
  await targetMembership.save();
  return targetMembership;
};