import { Router } from 'express';
import {
  submitContact,
  getSubmissions,
} from '../controllers/contactController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { UserRole } from '../types/index.js';

const router = Router();

// Public route - submit contact form
router.post('/', asyncHandler(submitContact));

// Admin-only route - get all submissions
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(getSubmissions)
);

export default router;

