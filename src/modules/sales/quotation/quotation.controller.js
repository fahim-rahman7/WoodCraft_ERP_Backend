import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import * as quotationService from './quotation.service.js';

export const createQuotation = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const userId = req.user.id;

  const quotation = await quotationService.createQuotationService(organizationId, userId, req.body);
  new ApiResponse(201, 'Quotation draft created successfully', quotation).send(res);
});

export const getQuotations = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const result = await quotationService.getQuotationsService(organizationId, req.query);

  new ApiResponse(200, 'Quotations retrieved successfully', result).send(res);
});

export const getQuotationById = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const quotation = await quotationService.getQuotationByIdService(organizationId, req.params.id);

  new ApiResponse(200, 'Quotation details retrieved successfully', quotation).send(res);
});

export const updateQuotation = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const quotation = await quotationService.updateQuotationService(organizationId, req.params.id, req.body);

  new ApiResponse(200, 'Quotation updated successfully', quotation).send(res);
});

export const sendQuotation = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const quotation = await quotationService.sendQuotationService(organizationId, req.params.id);

  new ApiResponse(200, 'Quotation marked as sent successfully', quotation).send(res);
});

export const quotationDecision = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const { status } = req.body;
  const quotation = await quotationService.decisionQuotationService(organizationId, req.params.id, status);

  new ApiResponse(200, `Quotation status updated to ${status} successfully`, quotation).send(res);
});