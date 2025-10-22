import { Router } from 'express';
import {
  createWithdrawal,
  listWithdrawals,
  getWithdrawal,
  updateWithdrawalStatus,
} from '../controllers/withdrawalController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { UserRole } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', asyncHandler(createWithdrawal));
router.get('/', asyncHandler(listWithdrawals));
router.get('/:id', asyncHandler(getWithdrawal));
router.put('/:id/status', authorize(UserRole.FINANCE, UserRole.ADMIN), asyncHandler(updateWithdrawalStatus));

export default router;

