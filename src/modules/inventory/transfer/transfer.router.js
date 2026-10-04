// POST /inventory/transfers	
// GET /inventory/transfers	
// GET /inventory/transfers/:id	
// POST /:id/approve
// POST /:id/complete	
// POST /:id/cancel	

import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { checkOrgRole, requireOrgContext } from '../../../middlewares/org.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import * as transferController from './transfer.controller.js';
import { createTransferSchema } from './transfer.validation.js';

const router = Router();

router.use(protect, requireOrgContext, checkOrgRole('OWNER', 'MANAGER'));


// ------create new transfer
router.post('/', validate(createTransferSchema), transferController.createNewTransfer);

// -----transfer list with filter
router.get('/', transferController.getAllTransfer);

// ------single transfer with id
router.get('/:id', transferController.getSingleTransfer);

// ------transfer approve
router.post('/:id/approve', transferController.approveTransfer);


// ------transfer complete
router.post('/:id/complete', transferController.completeTransfer)

// ------transfer cancel


export default router;