import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { UserRole } from '../types/index.js';
import {
  createBankAccount,
  listBankAccounts,
  getBankAccount,
  updateBankAccount,
  deleteBankAccount,
} from '../controllers/bankAccountController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create bank account (admin only)
router.post('/', authorize(UserRole.ADMIN), createBankAccount);

// List all bank accounts (authenticated users)
router.get('/', listBankAccounts);

// Get single bank account
router.get('/:id', getBankAccount);

// Update bank account (admin only)
router.put('/:id', authorize(UserRole.ADMIN), updateBankAccount);

// Delete bank account (admin only)
router.delete('/:id', authorize(UserRole.ADMIN), deleteBankAccount);

export default router;

