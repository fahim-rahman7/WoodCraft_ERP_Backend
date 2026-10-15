import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createBatchSchema = z.object({
  batchNumber: z.string().min(1, "Batch number is required"),
  itemId: z.string().regex(objectIdRegex, "Invalid item id"),
  supplierId: z.string().regex(objectIdRegex, "Invalid supplier id"),
  warehouseId: z.string().regex(objectIdRegex, "Invalid warehouse id"),
  initialQuantity: z.number({ required_error: "Initial quantity is required" }).positive("Initial quantity must be positive"),
  manufactureDate: z.string().optional(),
  receivedDate: z.string().optional(),
  remarks: z.string().optional(),
});

export const updateBatchSchema = z.object({
  batchNumber: z.string().min(1, "Batch number is required").optional(),
  remarks: z.string().optional(),
  status: z.enum(["ACTIVE", "EXHAUSTED", "EXPIRED", "CANCELLED"]).optional(),
});

export const batchIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid batch id"),
});