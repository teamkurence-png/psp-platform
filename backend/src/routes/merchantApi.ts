import { Router } from 'express';
import {
  createPaymentRequest,
  listPaymentRequests,
  getPaymentRequest,
  cancelPaymentRequest,
} from '../controllers/merchantApiController.js';
import { authenticateApiKey } from '../middleware/apiAuth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { apiRateLimit } from '../middleware/rateLimit.js';

const router = Router();

// All routes require API key authentication and rate limiting
router.use(authenticateApiKey);
router.use(apiRateLimit());

// Payment request endpoints
router.post('/payment-requests', asyncHandler(createPaymentRequest));
router.get('/payment-requests', asyncHandler(listPaymentRequests));
router.get('/payment-requests/:id', asyncHandler(getPaymentRequest));
router.post('/payment-requests/:id/cancel', asyncHandler(cancelPaymentRequest));

export default router;

