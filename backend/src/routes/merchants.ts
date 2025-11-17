import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  submitForReview,
  reviewOnboarding,
  listMerchants,
  assignMerchantToLeader,
  toggleMerchantLeader,
} from '../controllers/merchantController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { UserRole } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Merchant routes
router.get('/profile', asyncHandler(getProfile));
router.put('/profile', asyncHandler(updateProfile));
router.post('/submit-review', asyncHandler(submitForReview));

// Ops/Admin routes
router.get('/list', authorize(UserRole.OPS, UserRole.FINANCE, UserRole.ADMIN), asyncHandler(listMerchants));
router.get('/:merchantId', authorize(UserRole.OPS, UserRole.FINANCE, UserRole.ADMIN), asyncHandler(getProfile));
router.post('/:merchantId/review', authorize(UserRole.OPS, UserRole.ADMIN), asyncHandler(reviewOnboarding));

// Admin-only routes for merchant leader management
router.post('/:merchantId/assign-leader', authorize(UserRole.ADMIN), asyncHandler(assignMerchantToLeader));
router.post('/:merchantId/toggle-leader', authorize(UserRole.ADMIN), asyncHandler(toggleMerchantLeader));

export default router;

