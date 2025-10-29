import { Router } from 'express';
import {
  getPaymentFormByToken,
  submitCardPayment,
  getPaymentStatus,
  submitVerification,
} from '../controllers/pspPaymentController.js';
import {
  listPspPayments,
  getPspPaymentDetails,
  reviewPspPayment,
  resendVerificationNotification,
} from '../controllers/manualPayController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Public routes (no authentication required)
router.get('/:token', asyncHandler(getPaymentFormByToken));
router.post('/:token/submit', asyncHandler(submitCardPayment));
router.get('/:token/status', asyncHandler(getPaymentStatus));
router.post('/:token/verify', asyncHandler(submitVerification));

// Protected admin routes
router.use('/admin', authenticate);
router.get('/admin/list', asyncHandler(listPspPayments));
router.get('/admin/:submissionId/details', asyncHandler(getPspPaymentDetails));
router.post('/admin/:submissionId/review', asyncHandler(reviewPspPayment));
router.post('/admin/:submissionId/resend-verification', asyncHandler(resendVerificationNotification));

export default router;

