import { Router } from 'express';
import {
  createSettlement,
  listSettlements,
  getSettlement,
  updateSettlementStatus,
} from '../controllers/settlementController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { UserRole } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', asyncHandler(createSettlement));
router.get('/', asyncHandler(listSettlements));
router.get('/:id', asyncHandler(getSettlement));
router.put('/:id/status', authorize(UserRole.FINANCE, UserRole.ADMIN), asyncHandler(updateSettlementStatus));

export default router;

