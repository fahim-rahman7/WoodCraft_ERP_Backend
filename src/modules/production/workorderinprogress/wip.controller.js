import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import * as wipService from './wip.service.js';

export const createWip = asyncHandler(async (req, res) => {
  const wip = await wipService.createWip(req.organizationId, req.user.id, req.body);
  new ApiResponse(201, 'WIP record created successfully', wip).send(res);
});

export const getWips = asyncHandler(async (req, res) => {
  const wips = await wipService.getWips(req.organizationId, req.query);
  new ApiResponse(200, 'WIP records retrieved successfully', wips).send(res);
});

export const getWipSummary = asyncHandler(async (req, res) => {
  const summary = await wipService.getWipSummary(req.organizationId, req.query);
  new ApiResponse(200, 'WIP summary retrieved successfully', summary).send(res);
});

export const getWipById = asyncHandler(async (req, res) => {
  const wip = await wipService.getWipById(req.organizationId, req.params.id);
  new ApiResponse(200, 'WIP record retrieved successfully', wip).send(res);
});

export const startWip = asyncHandler(async (req, res) => {
  const wip = await wipService.startWip(req.organizationId, req.params.id);
  new ApiResponse(200, 'WIP record started successfully', wip).send(res);
});

export const updateWipProgress = asyncHandler(async (req, res) => {
  const wip = await wipService.updateWipProgress(
    req.organizationId,
    req.user.id,
    req.params.id,
    req.body
  );
  new ApiResponse(200, 'WIP progress updated successfully', wip).send(res);
});

export const scrapWip = asyncHandler(async (req, res) => {
  const wip = await wipService.scrapWip(
    req.organizationId,
    req.user.id,
    req.params.id,
    req.body
  );
  new ApiResponse(200, 'WIP scrap recorded successfully', wip).send(res);
});

export const holdWip = asyncHandler(async (req, res) => {
  const wip = await wipService.holdWip(req.organizationId, req.params.id, req.body);
  new ApiResponse(200, 'WIP record put on hold successfully', wip).send(res);
});

export const resumeWip = asyncHandler(async (req, res) => {
  const wip = await wipService.resumeWip(req.organizationId, req.params.id, req.body);
  new ApiResponse(200, 'WIP record resumed successfully', wip).send(res);
});

export const completeWip = asyncHandler(async (req, res) => {
  const wip = await wipService.completeWip(req.organizationId, req.params.id, req.body);
  new ApiResponse(200, 'WIP record completed successfully', wip).send(res);
});

export const cancelWip = asyncHandler(async (req, res) => {
  const wip = await wipService.cancelWip(req.organizationId, req.params.id, req.body);
  new ApiResponse(200, 'WIP record cancelled successfully', wip).send(res);
});
