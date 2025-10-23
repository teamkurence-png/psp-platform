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
  getUsers,
  updateUserRole,
  deactivateUser,
  activateUser,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { UserRole } from '../types/index.js';

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

// Admin routes - User management
router.get('/users', authenticate, authorize(UserRole.ADMIN), asyncHandler(getUsers));
router.put('/users/:userId/role', authenticate, authorize(UserRole.ADMIN), asyncHandler(updateUserRole));
router.put('/users/:userId/deactivate', authenticate, authorize(UserRole.ADMIN), asyncHandler(deactivateUser));
router.put('/users/:userId/activate', authenticate, authorize(UserRole.ADMIN), asyncHandler(activateUser));

export default router;

