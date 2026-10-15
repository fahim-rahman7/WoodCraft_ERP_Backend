import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import * as qiService from './qualityInspection.service.js';

export const createQualityInspection = asyncHandler(async (req, res) => {
  const qi = await qiService.createQualityInspection(req.organizationId, req.user._id, req.body);
  new ApiResponse(201, 'Quality Inspection created successfully', qi).send(res);
});

export const getQualityInspections = asyncHandler(async (req, res) => {
  const qis = await qiService.getQualityInspections(req.organizationId, req.query);
  new ApiResponse(200, 'Quality Inspections fetched successfully', qis).send(res);
});

export const getQualityInspectionById = asyncHandler(async (req, res) => {
  const qi = await qiService.getQualityInspectionById(req.organizationId, req.params.id);
  new ApiResponse(200, 'Quality Inspection details fetched successfully', qi).send(res);
});

export const inspectQualityInspection = asyncHandler(async (req, res) => {
  const qi = await qiService.inspectQualityInspection(req.organizationId, req.user._id, req.params.id);
  new ApiResponse(200, 'Quality Inspection completed successfully', qi).send(res);
});

export const cancelQualityInspection = asyncHandler(async (req, res) => {
  const qi = await qiService.cancelQualityInspection(req.organizationId, req.params.id);
  new ApiResponse(200, 'Quality Inspection cancelled successfully', qi).send(res);
});