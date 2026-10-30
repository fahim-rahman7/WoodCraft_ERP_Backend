import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as invitationService from './invitation.service.js';

export const sendInvitation = asyncHandler(async (req, res) => {
  const orgId = req.organizationId;
  const userId = req.user._id;
  const invitation = await invitationService.createInvitation(orgId, userId, req.body);
  new ApiResponse(201, 'Invitation sent successfully', { invitation }).send(res);
});

export const acceptInvitation = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const result = await invitationService.acceptInvitation(token, req.body, req.user || null);
  new ApiResponse(200, 'Invitation accepted successfully', result).send(res);
});