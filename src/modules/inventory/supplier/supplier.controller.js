import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import * as supplierService from './supplier.service.js';

export const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.createSupplier(req.organizationId, req.body);
  new ApiResponse(201, 'Supplier created successfully', supplier).send(res);
});

export const getSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await supplierService.getSuppliers(req.organizationId, req.query);
  new ApiResponse(200, 'Suppliers fetched successfully', suppliers).send(res);
});

export const getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await supplierService.getSupplierById(req.organizationId, req.params.id);
  new ApiResponse(200, 'Supplier details fetched successfully', supplier).send(res);
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.updateSupplier(
    req.organizationId,
    req.params.id,
    req.body
  );
  new ApiResponse(200, 'Supplier updated successfully', supplier).send(res);
});

export const deleteSupplier = asyncHandler(async (req, res) => {
  await supplierService.deleteSupplier(req.organizationId, req.params.id);
  new ApiResponse(200, 'Supplier deleted successfully').send(res);
});