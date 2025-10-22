import { Router } from 'express';
import {
  getSettings,
  updateSetting,
  deleteSetting,
} from '../controllers/settingsController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { UserRole } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', asyncHandler(getSettings));
router.put('/:key', authorize(UserRole.ADMIN), asyncHandler(updateSetting));
router.delete('/:key', authorize(UserRole.ADMIN), asyncHandler(deleteSetting));

export default router;

