import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as orgService from './organization.service.js';

export const createOrganization = asyncHandler(async (req, res) => {
  const organization = await orgService.createOrganizationWithOwner(req.user.id, req.body);
  new ApiResponse(201, 'Organization created successfully', organization).send(res);
});

export const getMyOrganizations = asyncHandler(async (req, res) => {
  const organizations = await orgService.getUserOrganizations(req.user.id);
  new ApiResponse(200, 'User organizations retrieved successfully', organizations).send(res);
});

export const getMembers = asyncHandler(async (req, res) => {
  const members = await orgService.getOrganizationMembers(req.organizationId);
  new ApiResponse(200, 'Organization members retrieved successfully', members).send(res);
});

export const updateRole = asyncHandler(async (req, res) => {
  const updatedMember = await orgService.updateMemberRole(
    req.organizationId,
    req.params.memberId,
    req.body.role
  );
  new ApiResponse(200, 'Member role updated successfully', updatedMember).send(res);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const updatedMember = await orgService.updateMemberStatus(
    req.organizationId,
    req.params.memberId,
    req.body.status
  );
  new ApiResponse(200, 'Member status updated successfully', updatedMember).send(res);
});