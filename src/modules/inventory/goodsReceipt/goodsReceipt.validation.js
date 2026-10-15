import { z } from 'zod';

export const createGoodsReceiptSchema = z.object({
  purchaseOrderId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid purchase order ID format')
    .optional(),

  warehouseId: z
    .string({ required_error: 'Warehouse ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID format'),
    
  supplierId: z
    .string({ required_error: 'Supplier ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID format'),
    
  supplierInvoiceNo: z.string().optional(),
  
  items: z
    .array(
      z.object({
        itemId: z
          .string({ required_error: 'Item ID is required' })
          .regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID format'),
        batchNumber: z
          .string({ required_error: 'Batch number is required for each item' })
          .trim(), // ব্যাচ নম্বর বাধ্যতামূলক করা হলো
        quantity: z.number().positive('Quantity must be greater than zero'),
        unitPrice: z.number().nonnegative('Unit price cannot be negative').optional(),
      })
    )
    .min(1, 'At least one item is required'),
    
  remarks: z.string().optional(),
});