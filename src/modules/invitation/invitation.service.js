import crypto from 'crypto';
import mongoose from 'mongoose';
import argon2 from 'argon2';
import { Invitation } from './invitation.model.js';
import { Organization } from '../organization/organization.model.js';
import { Membership } from '../membership/membership.model.js';
import { User } from '../auth/auth.model.js';
import { AppError } from '../../utils/appError.js';
import { sendInvitationEmail } from '../../utils/sendEmail.js';

export const createInvitation = async (orgId, userId, { email, role }) => {
  const organization = await Organization.findById(orgId);
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  // Check if user already has an active membership in this organization
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const existingMembership = await Membership.findOne({
      userId: existingUser._id,
      organizationId: orgId,
      status: 'ACTIVE',
    });
    if (existingMembership) {
      throw new AppError('User is already an active member of this organization', 400);
    }
  }

  // Check for existing pending invitation
  const existingInvite = await Invitation.findOne({
    email,
    organizationId: orgId,
    status: 'PENDING',
  });

  if (existingInvite && existingInvite.expiresAt > new Date()) {
    throw new AppError('An active invitation has already been sent to this email', 400);
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity

  const invitation = await Invitation.create({
    email,
    organizationId: orgId,
    role,
    invitedBy: userId,
    token,
    expiresAt,
  });

  // Send invitation email
  const inviteLink = `${process.env.FRONTEND_URL}/accept-invitation?token=${token}`;
  await sendInvitationEmail(email, organization.name, role, inviteLink);

  return invitation;
};

export const acceptInvitation = async (token, { name, password }, loggedInUser = null) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const invitation = await Invitation.findOne({ token, status: 'PENDING' }).session(session);

    if (!invitation) {
      throw new AppError('Invalid or already used invitation token', 400);
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'EXPIRED';
      await invitation.save({ session });
      throw new AppError('Invitation has expired', 400);
    }

    let targetUser = loggedInUser;

    if (!targetUser) {
      targetUser = await User.findOne({ email: invitation.email }).session(session);

      if (!targetUser) {
        if (!password || !name) {
          throw new AppError('Name and password are required to create an account and accept the invitation', 400);
        }

        const hashedPassword = await argon2.hash(password);
        const newUserArray = await User.create(
          [
            {
              name,
              email: invitation.email,
              password: hashedPassword,
              platformRole: 'USER',
              isVerified: true,
            },
          ],
          { session }
        );
        targetUser = newUserArray[0];
      }
    }

    // Check if membership already exists
    const existingMembership = await Membership.findOne({
      userId: targetUser._id,
      organizationId: invitation.organizationId,
    }).session(session);

    if (existingMembership) {
      if (existingMembership.status === 'ACTIVE') {
        throw new AppError('User is already a member of this organization', 400);
      } else {
        existingMembership.status = 'ACTIVE';
        existingMembership.role = invitation.role;
        await existingMembership.save({ session });
      }
    } else {
      await Membership.create(
        [
          {
            userId: targetUser._id,
            organizationId: invitation.organizationId,
            role: invitation.role,
            status: 'ACTIVE',
            invitedBy: invitation.invitedBy,
            joinedAt: new Date(),
          },
        ],
        { session }
      );
    }

    invitation.status = 'ACCEPTED';
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = targetUser._id;
    await invitation.save({ session });

    await session.commitTransaction();
    return { user: targetUser, organizationId: invitation.organizationId };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};