import { Router } from 'express';
import {
  createPaymentRequest,
  listPaymentRequests,
  getPaymentRequest,
  updatePaymentRequest,
  cancelPaymentRequest,
  getWebhookLogs,
} from '../controllers/paymentRequestController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Public route (for customer viewing payment request)
router.get('/:id/public', asyncHandler(getPaymentRequest));

// Protected routes
router.use(authenticate);

router.post('/', asyncHandler(createPaymentRequest));
router.get('/', asyncHandler(listPaymentRequests));
router.get('/:id/webhook-logs', asyncHandler(getWebhookLogs));
router.get('/:id', asyncHandler(getPaymentRequest));
router.put('/:id', asyncHandler(updatePaymentRequest));
router.post('/:id/cancel', asyncHandler(cancelPaymentRequest));

export default router;

