import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { UserRole } from '../types/index.js';
import {
  createCard,
  listCards,
  getCard,
  updateCard,
  deleteCard,
} from '../controllers/cardController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create card (admin only)
router.post('/', authorize(UserRole.ADMIN), createCard);

// List all cards (admin, ops, finance only)
router.get('/', authorize(UserRole.ADMIN, UserRole.OPS, UserRole.FINANCE), listCards);

// Get single card (admin, ops, finance only)
router.get('/:id', authorize(UserRole.ADMIN, UserRole.OPS, UserRole.FINANCE), getCard);

// Update card (admin only)
router.put('/:id', authorize(UserRole.ADMIN), updateCard);

// Delete card (admin only)
router.delete('/:id', authorize(UserRole.ADMIN), deleteCard);

export default router;

