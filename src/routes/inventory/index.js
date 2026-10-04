import { Router } from 'express';
import warehouseRoutes from '../../modules/inventory/warehouse/warehouse.routes.js';
import itemRoutes from '../../modules/inventory/item/item.routes.js';
import stockRoutes from '../../modules/inventory/stock/stock.routes.js';
import stockMovementRoutes from '../../modules/inventory/stockMovement/stockMovement.routes.js';
import categoryRoutes from '../../modules/inventory/Category/categoryRoutes.js';
const router = Router();

// Endpoint path: /api/v1/inventory/warehouses
router.use('/warehouses', warehouseRoutes);
router.use('/items', itemRoutes);
router.use('/stocks', stockRoutes);
router.use('/stock-movements', stockMovementRoutes);
router.use('/categories', categoryRoutes);


export default router;