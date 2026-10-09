import { z } from 'zod';

const goodsReceiptItemSchema = z.object({
  itemId: z.string({
    required_error: 'Item ID is required',
  }),
  quantity: z
    .number({
      required_error: 'Quantity is required',
    })
    .positive('Quantity must be greater than zero'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative').optional().default(0),
});

export const createGoodsReceiptSchema = z.object({
  warehouseId: z.string({
    required_error: 'Warehouse ID is required',
  }),
  supplierName: z.string().optional(),
  supplierInvoiceNo: z.string().optional(),
  items: z
    .array(goodsReceiptItemSchema)
    .min(1, 'At least one item is required in Goods Receipt'),
  remarks: z.string().optional(),
});

export const updateGoodsReceiptSchema = createGoodsReceiptSchema.partial();