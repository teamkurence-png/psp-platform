import { Router } from 'express';
import {
  getDashboard,
  getGroupMerchants,
  getGroupPaymentRequests,
  getCommissions,
} from '../controllers/merchantLeaderController.js';
import { authenticate } from '../middleware/auth.js';
import { requireMerchantLeader } from '../middleware/merchantLeader.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// All routes require authentication and merchant leader status
router.use(authenticate);
router.use(requireMerchantLeader);

// Merchant leader routes
router.get('/dashboard', asyncHandler(getDashboard));
router.get('/group-merchants', asyncHandler(getGroupMerchants));
router.get('/group-payment-requests', asyncHandler(getGroupPaymentRequests));
router.get('/commissions', asyncHandler(getCommissions));

export default router;

