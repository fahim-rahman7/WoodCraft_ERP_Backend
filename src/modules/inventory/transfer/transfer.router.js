// POST /inventory/transfers	
// GET /inventory/transfers	
// GET /inventory/transfers/:id	
// POST /:id/approve
// POST /:id/complete	
// POST /:id/cancel	

import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { requireOrgContext } from '../../../middlewares/org.middleware.js';
import * as transferController from './transfer.controller.js';

const router = Router();

router.use(protect, requireOrgContext);


// ------create new transfer
router.post('/', transferController.createNewTransfer);

// -----transfer list with filter

// ------single transfer with id

// ------transfer approve

// ------transfer complete

// ------transfer cancel


export default router;