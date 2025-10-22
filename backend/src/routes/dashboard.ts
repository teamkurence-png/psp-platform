import { Router } from 'express';
import {
  getDashboardStats,
  getDashboardAlerts,
  getRecentTransactions,
} from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/stats', asyncHandler(getDashboardStats));
router.get('/alerts', asyncHandler(getDashboardAlerts));
router.get('/recent-transactions', asyncHandler(getRecentTransactions));

export default router;

