import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  setup2FA,
  verify2FA,
  disable2FA,
  getMe,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Public routes
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/refresh', asyncHandler(refreshToken));

// Protected routes
router.post('/logout', authenticate, asyncHandler(logout));
router.get('/me', authenticate, asyncHandler(getMe));

// 2FA routes
router.post('/2fa/setup', authenticate, asyncHandler(setup2FA));
router.post('/2fa/verify', authenticate, asyncHandler(verify2FA));
router.post('/2fa/disable', authenticate, asyncHandler(disable2FA));

export default router;

