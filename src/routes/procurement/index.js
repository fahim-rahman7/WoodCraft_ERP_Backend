import { Router } from 'express';
import supplierRoutes from "../../modules/procurement/supplier/supplier.routes.js"
import purchaseRoutes from "../../modules/procurement/purchase/purchase.routes.js"


const router = Router();

// Endpoint path: /api/v1/inventory/warehouses
router.use('/suppliers', supplierRoutes);
router.use('/purchase', purchaseRoutes);


export default router;