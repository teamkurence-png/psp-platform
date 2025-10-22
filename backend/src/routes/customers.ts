import { Router } from 'express';
import {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  addCustomerNote,
  deleteCustomer,
} from '../controllers/customerController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', asyncHandler(createCustomer));
router.get('/', asyncHandler(listCustomers));
router.get('/:id', asyncHandler(getCustomer));
router.put('/:id', asyncHandler(updateCustomer));
router.post('/:id/notes', asyncHandler(addCustomerNote));
router.delete('/:id', asyncHandler(deleteCustomer));

export default router;

