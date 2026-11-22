import { Router } from 'express';
import customerRoutes from '../../modules/sales/customer/customer.routes.js';
import quotationRoutes from '../../modules/sales/quotation/quotation.routes.js';
import salesOrderRoutes from '../../modules/sales/salesOrder/salesOrder.routes.js';
import deliveryNoteRoutes from '../../modules/sales/deliveryNote/deliveryNote.routes.js';
import salesInvoiceRoutes from '../../modules/sales/salesInvoice/salesInvoice.routes.js';
import salesReturnRoutes from '../../modules/sales/salesReturn/salesReturn.routes.js';


const router = Router();

router.use('/customers', customerRoutes);
router.use('/quotations', quotationRoutes);
router.use('/sales-orders', salesOrderRoutes);
router.use('/delivery-notes', deliveryNoteRoutes);
router.use('/sales-invoices', salesInvoiceRoutes);
router.use('/sales-returns', salesReturnRoutes);


export default router;