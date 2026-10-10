import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import * as materialIssueService from './materialIssue.service.js';

export const createMaterialIssue = asyncHandler(async (req, res) => {
  const issue = await materialIssueService.createMaterialIssue(
    req.organizationId,
    req.user.id,
    req.body
  );

  new ApiResponse(201, 'Material Issue draft created successfully', issue).send(res);
});

export const getMaterialIssues = asyncHandler(async (req, res) => {
  const issues = await materialIssueService.getMaterialIssues(
    req.organizationId,
    req.query
  );

  new ApiResponse(200, 'Material Issues fetched successfully', issues).send(res);
});

export const getMaterialIssueById = asyncHandler(async (req, res) => {
  const issue = await materialIssueService.getMaterialIssueById(
    req.organizationId,
    req.params.id
  );

  new ApiResponse(200, 'Material Issue details fetched successfully', issue).send(res);
});

export const issueMaterial = asyncHandler(async (req, res) => {
  const issue = await materialIssueService.issueMaterial(
    req.organizationId,
    req.user.id,
    req.params.id
  );

  new ApiResponse(200, 'Material issued successfully and Stock deducted', issue).send(res);
});