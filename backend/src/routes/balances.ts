import { Router } from 'express';
import {
  getBalance,
  getBalanceHistory,
  updateBalance,
} from '../controllers/balanceController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { UserRole } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', asyncHandler(getBalance));
router.get('/history', asyncHandler(getBalanceHistory));
router.put('/:merchantId', authorize(UserRole.ADMIN), asyncHandler(updateBalance));

export default router;

