import { Response } from 'express';
import { Transaction } from '../models/Transaction.js';
import { Balance } from '../models/Balance.js';
import { AuthRequest, UserRole, TransactionStatus, MerchantConfirmation } from '../types/index.js';

export const listTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { 
      status, 
      method, 
      merchantConfirmation,
      page = 1, 
      limit = 10 
    } = req.query;

    let query: any = {};

    // For merchants, only show their own transactions
    if (req.user.role === UserRole.MERCHANT) {
      query.userId = req.user.id;
    } else if (req.query.merchantId) {
      // For ops/admin, allow filtering by merchantId (userId)
      query.userId = req.query.merchantId;
    }

    // Apply filters
    if (status) query.platformStatus = status;
    if (method) query.method = method;
    if (merchantConfirmation) query.merchantConfirmation = merchantConfirmation;

    const transactions = await Transaction.find(query)
      .populate('userId', 'legalName supportEmail email')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        total,
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('List transactions error:', error);
    res.status(500).json({ success: false, error: 'Failed to list transactions' });
  }
};

export const getTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const transaction = await Transaction.findById(id).populate('userId', 'legalName supportEmail email');

    if (!transaction) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    // Check authorization
    if (req.user.role === UserRole.MERCHANT) {
      if (transaction.userId._id.toString() !== req.user.id) {
        res.status(403).json({ success: false, error: 'Forbidden' });
        return;
      }
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ success: false, error: 'Failed to get transaction' });
  }
};

export const confirmTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.MERCHANT) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const { confirmation, proofFilePath } = req.body;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    // Check ownership
    if (transaction.userId.toString() !== req.user.id) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    transaction.merchantConfirmation = confirmation;
    
    if (transaction.bankWireDetails) {
      transaction.bankWireDetails.confirmationStatus = confirmation;
      if (proofFilePath) {
        transaction.bankWireDetails.proofFilePath = proofFilePath;
      }
    }

    transaction.timeline.push({
      event: `Merchant confirmation: ${confirmation}`,
      timestamp: new Date(),
      actor: req.user.email,
    });

    await transaction.save();

    res.json({ 
      success: true, 
      message: 'Transaction confirmed',
      data: transaction 
    });
  } catch (error) {
    console.error('Confirm transaction error:', error);
    res.status(500).json({ success: false, error: 'Failed to confirm transaction' });
  }
};

export const reviewTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || ![UserRole.OPS, UserRole.ADMIN].includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    if (![TransactionStatus.APPROVED, TransactionStatus.REJECTED].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    transaction.platformStatus = status;

    transaction.timeline.push({
      event: `Transaction ${status} by ops`,
      timestamp: new Date(),
      actor: req.user.email,
      notes,
    });

    if (notes) {
      transaction.notes.push({
        text: notes,
        createdBy: req.user.id as any,
        createdAt: new Date(),
      });
    }

    // Update balance if approved
    if (status === TransactionStatus.APPROVED) {
      const balance = await Balance.findOne({ userId: transaction.userId });
      if (balance) {
        balance.pending += transaction.net;
        await balance.save();
      }
    }

    await transaction.save();

    res.json({ 
      success: true, 
      message: `Transaction ${status}`,
      data: transaction 
    });
  } catch (error) {
    console.error('Review transaction error:', error);
    res.status(500).json({ success: false, error: 'Failed to review transaction' });
  }
};

