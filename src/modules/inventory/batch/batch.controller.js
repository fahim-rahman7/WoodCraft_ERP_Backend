import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import * as batchService from './batch.service.js';

export const createBatch = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const result = await batchService.createBatch(organizationId, req.body);
  new ApiResponse(201, 'Batch created successfully', result).send(res);
});

export const getAllBatches = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const result = await batchService.getAllBatches(organizationId, req.query);
  new ApiResponse(200, 'Batches retrieved successfully', result).send(res);
});

export const getBatchById = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const { id } = req.params;
  const result = await batchService.getBatchById(organizationId, id);
  new ApiResponse(200, 'Batch retrieved successfully', result).send(res);
});

export const updateBatch = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const { id } = req.params;
  const result = await batchService.updateBatch(organizationId, id, req.body);
  new ApiResponse(200, 'Batch updated successfully', result).send(res);
});

export const deleteBatch = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const { id } = req.params;
  const result = await batchService.deleteBatch(organizationId, id);
  new ApiResponse(200, 'Batch deleted successfully', result).send(res);
});