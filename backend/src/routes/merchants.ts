import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  submitForReview,
  reviewOnboarding,
  listMerchants,
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

export default router;

