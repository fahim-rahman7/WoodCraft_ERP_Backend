import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import * as itemService from './item.service.js';

export const createItem = asyncHandler(async (req, res) => {
  const item = await itemService.createItem(req.organizationId, req.body);

  new ApiResponse(201, 'Item created successfully', item).send(res);
});

export const getItems = asyncHandler(async (req, res) => {
  const items = await itemService.getItems(req.organizationId, req.query);

  new ApiResponse(200, 'Items fetched successfully', items).send(res);
});

export const getItemById = asyncHandler(async (req, res) => {
  const item = await itemService.getItemById(req.organizationId, req.params.id);

  new ApiResponse(200, 'Item details fetched successfully', item).send(res);
});

export const updateItem = asyncHandler(async (req, res) => {
  const item = await itemService.updateItem(
    req.organizationId,
    req.params.id,
    req.body
  );

  new ApiResponse(200, 'Item updated successfully', item).send(res);
});

export const deleteItem = asyncHandler(async (req, res) => {
  await itemService.deleteItem(req.organizationId, req.params.id);

  new ApiResponse(200, 'Item deleted successfully').send(res);
});