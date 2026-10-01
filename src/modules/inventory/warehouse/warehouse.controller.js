import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import * as warehouseService from './warehouse.service.js';

export const createWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.createWarehouse(req.organizationId, req.body);

  new ApiResponse(201, 'Warehouse created successfully', warehouse).send(res);
});

export const getWarehouses = asyncHandler(async (req, res) => {
  const warehouses = await warehouseService.getWarehouses(req.organizationId, req.query);

  new ApiResponse(200, 'Warehouses fetched successfully', warehouses).send(res);
});

export const getWarehouseById = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.getWarehouseById(req.organizationId, req.params.id);

  new ApiResponse(200, 'Warehouse details fetched successfully', warehouse).send(res);
});

export const updateWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.updateWarehouse(
    req.organizationId,
    req.params.id,
    req.body
  );

  new ApiResponse(200, 'Warehouse updated successfully', warehouse).send(res);
});

export const deleteWarehouse = asyncHandler(async (req, res) => {
  await warehouseService.deleteWarehouse(req.organizationId, req.params.id);

  new ApiResponse(200, 'Warehouse deleted successfully').send(res);
});