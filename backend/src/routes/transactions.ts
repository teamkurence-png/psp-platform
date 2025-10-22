import { Router } from 'express';
import {
  listTransactions,
  getTransaction,
  confirmTransaction,
  reviewTransaction,
} from '../controllers/transactionController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { UserRole } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', asyncHandler(listTransactions));
router.get('/:id', asyncHandler(getTransaction));
router.post('/:id/confirm', asyncHandler(confirmTransaction));
router.post('/:id/review', authorize(UserRole.OPS, UserRole.ADMIN), asyncHandler(reviewTransaction));

export default router;

