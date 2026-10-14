import { Router } from 'express';
import warehouseRoutes from '../../modules/inventory/warehouse/warehouse.routes.js';
import itemRoutes from '../../modules/inventory/item/item.routes.js';
import stockRoutes from '../../modules/inventory/stock/stock.routes.js';
import stockMovementRoutes from '../../modules/inventory/stockMovement/stockMovement.routes.js';
import goodsReceiptRoutes from '../../modules/inventory/goodsReceipt/goodsReceipt.routes.js';
import transferRoutes from "../../modules/inventory/transfer/transfer.routes.js"
import adjustmentRoutes from '../../modules/inventory/adjustment/adjustment.routes.js';
import categoryRoutes from "../../modules/inventory/category/category.routes.js"
import supplierRoutes from "../../modules/inventory/supplier/supplier.router.js"
import purchaseRoutes from "../../modules/inventory/purchase/purchase.routes.js"



const router = Router();

// Endpoint path: /api/v1/inventory/warehouses
router.use('/warehouses', warehouseRoutes);
router.use('/items', itemRoutes);
router.use('/stocks', stockRoutes);
router.use('/stock-movements', stockMovementRoutes);
router.use('/goods-receipts', goodsReceiptRoutes);
router.use('/transfer', transferRoutes);
router.use('/adjustments', adjustmentRoutes);
router.use('/category', categoryRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/purchase', purchaseRoutes);

export default router;