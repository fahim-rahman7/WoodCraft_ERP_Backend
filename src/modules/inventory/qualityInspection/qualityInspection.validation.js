import { z } from 'zod';

export const createQualityInspectionSchema = z.object({
  goodsReceiptId: z
    .string({ required_error: 'Goods Receipt ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Goods Receipt ID format'),
  supplierId: z
    .string({ required_error: 'Supplier ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Supplier ID format'),
  warehouseId: z
    .string({ required_error: 'Warehouse ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Warehouse ID format'),
  inspectionDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  remarks: z.string().optional(),
  items: z
    .array(
      z
        .object({
          itemId: z
            .string({ required_error: 'Item ID is required' })
            .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Item ID format'),
          receivedQuantity: z.number().positive('Received quantity must be greater than zero'),
          acceptedQuantity: z.number().nonnegative('Accepted quantity cannot be negative'),
          rejectedQuantity: z.number().nonnegative('Rejected quantity cannot be negative'),
          inspectionResult: z.enum(['PASS', 'FAIL', 'PARTIAL']).optional(),
          remarks: z.string().optional(),
        })
        .refine((data) => data.acceptedQuantity + data.rejectedQuantity === data.receivedQuantity, {
          message: 'Sum of accepted and rejected quantities must equal received quantity',
          path: ['acceptedQuantity'],
        })
    )
    .min(1, 'At least one inspection item is required'),
});

export const updateQualityInspectionSchema = createQualityInspectionSchema.partial();

export const qualityInspectionIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Quality Inspection ID format'),
});