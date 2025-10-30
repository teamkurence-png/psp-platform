import { Router } from 'express';
import {
  createApiKey,
  listApiKeys,
  getApiKey,
  revokeApiKey,
} from '../controllers/apiKeyController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { strictRateLimit } from '../middleware/rateLimit.js';

const router = Router();

// All routes require JWT authentication
router.use(authenticate);

// Apply strict rate limiting to API key creation
router.post('/', strictRateLimit, asyncHandler(createApiKey));

// List and manage API keys
router.get('/', asyncHandler(listApiKeys));
router.get('/:id', asyncHandler(getApiKey));
router.delete('/:id', asyncHandler(revokeApiKey));

export default router;

