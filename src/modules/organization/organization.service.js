import mongoose from 'mongoose';
import { Organization } from './organization.model.js';
import { Membership } from '../membership/membership.model.js';
import { AppError } from '../../utils/appError.js';

export const createOrganizationWithOwner = async (userId, orgData) => {
 const trimmedName = orgData.name.trim();

  // Check if this user already owns an organization with the same name (case-insensitive)
  const existingOrg = await Organization.findOne({
    ownerId: userId,
    name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
  });

  if (existingOrg) {
    throw new AppError('You already own an organization with this name.', 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [organization] = await Organization.create(
      [{ ...orgData, ownerId: userId }],
      { session }
    );

    await Membership.create(
      [
        {
          userId,
          organizationId: organization._id,
          role: 'OWNER',
          status: 'ACTIVE',
          joinedAt: new Date(),
          invitedBy: null,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return organization;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getUserOrganizations = async (userId) => {
  const memberships = await Membership.find({ userId, status: 'ACTIVE' })
    .populate('organizationId')
    .lean();

  return memberships.map((m) => ({
    ...m.organizationId,
    myRole: m.role,
    membershipId: m._id,
  }));
};

export const getOrganizationMembers = async (orgId) => {
  return await Membership.find({ organizationId: orgId, status: { $ne: 'REMOVED' } })
    .populate('userId', 'name email platformRole')
    .lean();
};

export const updateMemberRole = async (orgId, memberId, newRole) => {
  const membership = await Membership.findOne({ _id: memberId, organizationId: orgId });
  if (!membership) {
    throw new AppError('Member not found in this organization', 404);
  }

  if (membership.role === 'OWNER' && newRole !== 'OWNER') {
    const ownerCount = await Membership.countDocuments({
      organizationId: orgId,
      role: 'OWNER',
      status: 'ACTIVE',
    });
    if (ownerCount <= 1) {
      throw new AppError('Cannot demote the sole owner of the organization', 400);
    }
  }

  membership.role = newRole;
  await membership.save();
  return membership;
};

export const updateMemberStatus = async (orgId, memberId, newStatus) => {
  const membership = await Membership.findOne({ _id: memberId, organizationId: orgId });
  if (!membership) {
    throw new AppError('Member not found in this organization', 404);
  }

  if (membership.role === 'OWNER' && newStatus !== 'ACTIVE') {
    throw new AppError('Cannot suspend or remove the organization owner', 400);
  }

  membership.status = newStatus;
  await membership.save();
  return membership;
};