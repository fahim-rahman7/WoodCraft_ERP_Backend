import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as membershipService from './membership.service.js';

export const getMyMemberships = asyncHandler(async (req, res) => {
  const memberships = await membershipService.getUserMemberships(req.user.id);
  new ApiResponse(200, 'User memberships retrieved successfully', memberships).send(res);
});

export const getActiveContext = asyncHandler(async (req, res) => {
  const membership = await membershipService.getActiveMembershipContext(
    req.user.id,
    req.organizationId
  );
  new ApiResponse(200, 'Active organization context retrieved', membership).send(res);
});

export const leaveOrg = asyncHandler(async (req, res) => {
  await membershipService.leaveOrganization(req.user.id, req.organizationId);
  new ApiResponse(200, 'Successfully left the organization').send(res);
});

export const removeMember = asyncHandler(async (req, res) => {
  const removedMember = await membershipService.removeMemberFromOrg(
    req.organizationId,
    req.params.memberId,
    req.membership.role
  );
  new ApiResponse(200, 'Member removed from organization successfully', removedMember).send(res);
});