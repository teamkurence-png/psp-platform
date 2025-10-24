import { Response } from 'express';
import { z } from 'zod';
import { BankAccount } from '../models/BankAccount.js';
import { AuthRequest, UserRole } from '../types/index.js';

// Validation schemas
const createBankAccountSchema = z.object({
  bankName: z.string().min(1),
  accountNumber: z.string().min(1),
  routingNumber: z.string().optional(),
  swiftCode: z.string().optional(),
  iban: z.string().optional(),
  bankAddress: z.string().optional(),
  beneficiaryName: z.string().optional(),
  supportedGeos: z.array(z.string()).min(1, 'At least one country must be selected'),
});

const updateBankAccountSchema = z.object({
  bankName: z.string().min(1).optional(),
  accountNumber: z.string().min(1).optional(),
  routingNumber: z.string().optional(),
  swiftCode: z.string().optional(),
  iban: z.string().optional(),
  bankAddress: z.string().optional(),
  beneficiaryName: z.string().optional(),
  supportedGeos: z.array(z.string()).min(1, 'At least one country must be selected').optional(),
  isActive: z.boolean().optional(),
});

export const createBankAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const validatedData = createBankAccountSchema.parse(req.body);

    const bankAccount = await BankAccount.create(validatedData);

    res.status(201).json({ 
      success: true, 
      message: 'Bank account created successfully',
      data: bankAccount 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    console.error('Create bank account error:', error);
    res.status(500).json({ success: false, error: 'Failed to create bank account' });
  }
};

export const listBankAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const query: any = {};

    // Non-admin users only see active bank accounts
    if (req.user.role !== UserRole.ADMIN) {
      query.isActive = true;
    }

    const bankAccounts = await BankAccount.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bankAccounts,
    });
  } catch (error) {
    console.error('List bank accounts error:', error);
    res.status(500).json({ success: false, error: 'Failed to list bank accounts' });
  }
};

export const getBankAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const bankAccount = await BankAccount.findById(id);

    if (!bankAccount) {
      res.status(404).json({ success: false, error: 'Bank account not found' });
      return;
    }

    // Non-admin users can only see active accounts
    if (req.user.role !== UserRole.ADMIN && !bankAccount.isActive) {
      res.status(404).json({ success: false, error: 'Bank account not found' });
      return;
    }

    res.json({ success: true, data: bankAccount });
  } catch (error) {
    console.error('Get bank account error:', error);
    res.status(500).json({ success: false, error: 'Failed to get bank account' });
  }
};

export const updateBankAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const validatedData = updateBankAccountSchema.parse(req.body);

    const bankAccount = await BankAccount.findByIdAndUpdate(
      id,
      validatedData,
      { new: true, runValidators: true }
    );

    if (!bankAccount) {
      res.status(404).json({ success: false, error: 'Bank account not found' });
      return;
    }

    res.json({ 
      success: true, 
      message: 'Bank account updated successfully',
      data: bankAccount 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    console.error('Update bank account error:', error);
    res.status(500).json({ success: false, error: 'Failed to update bank account' });
  }
};

export const deleteBankAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    // Soft delete by setting isActive to false
    const bankAccount = await BankAccount.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!bankAccount) {
      res.status(404).json({ success: false, error: 'Bank account not found' });
      return;
    }

    res.json({ 
      success: true, 
      message: 'Bank account deleted successfully',
      data: bankAccount 
    });
  } catch (error) {
    console.error('Delete bank account error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete bank account' });
  }
};

