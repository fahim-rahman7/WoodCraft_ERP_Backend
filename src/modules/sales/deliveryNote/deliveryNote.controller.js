import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import * as deliveryNoteService from './deliveryNote.service.js';

export const createDeliveryNote = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const userId = req.user.id;

  const deliveryNote = await deliveryNoteService.createDeliveryNoteService(organizationId, userId, req.body);
  new ApiResponse(201, 'Delivery Note draft created successfully', deliveryNote).send(res);
});

export const getDeliveryNotes = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const result = await deliveryNoteService.getDeliveryNotesService(organizationId, req.query);

  new ApiResponse(200, 'Delivery Notes retrieved successfully', result).send(res);
});

export const getDeliveryNoteById = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const deliveryNote = await deliveryNoteService.getDeliveryNoteByIdService(organizationId, req.params.id);

  new ApiResponse(200, 'Delivery Note details retrieved successfully', deliveryNote).send(res);
});

export const dispatchDeliveryNote = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId;
  const userId = req.user._id;

  const deliveryNote = await deliveryNoteService.dispatchDeliveryNoteService(organizationId, userId, req.params.id);
  new ApiResponse(200, 'Delivery Note dispatched successfully and stock updated', deliveryNote).send(res);
});