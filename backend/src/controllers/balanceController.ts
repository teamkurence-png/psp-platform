import { Response } from 'express';
import { Balance } from '../models/Balance.js';
import { Transaction } from '../models/Transaction.js';
import { AuthRequest, UserRole, TransactionStatus } from '../types/index.js';

export const getBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    let userId;
    if (req.user.role === UserRole.MERCHANT) {
      userId = req.user.id;
    } else {
      // For ops/admin viewing merchant balance
      userId = req.query.merchantId; // Note: param name kept for backward compatibility
    }

    if (!userId) {
      res.status(400).json({ success: false, error: 'User ID required' });
      return;
    }

    let balance = await Balance.findOne({ userId });

    // Create balance if doesn't exist
    if (!balance) {
      balance = await Balance.create({
        userId,
        available: 0,
        pending: 0,
        reserve: 0,
        currency: 'USD',
        pendingBreakdown: [],
      });
    }

    res.json({ success: true, data: balance });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ success: false, error: 'Failed to get balance' });
  }
};

export const getBalanceHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    let userId;
    if (req.user.role === UserRole.MERCHANT) {
      userId = req.user.id;
    } else {
      userId = req.query.merchantId; // Note: param name kept for backward compatibility
    }

    if (!userId) {
      res.status(400).json({ success: false, error: 'User ID required' });
      return;
    }

    const { startDate, endDate, page = 1, limit = 50 } = req.query;

    const query: any = { userId };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    // Get transactions that affect balance
    const transactions = await Transaction.find({
      ...query,
      platformStatus: { $in: [TransactionStatus.APPROVED, TransactionStatus.SETTLED] },
    })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .select('transactionId amount currency fees net platformStatus createdAt settledAt');

    const total = await Transaction.countDocuments({
      ...query,
      platformStatus: { $in: [TransactionStatus.APPROVED, TransactionStatus.SETTLED] },
    });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get balance history error:', error);
    res.status(500).json({ success: false, error: 'Failed to get balance history' });
  }
};

export const updateBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // This would typically be called by system processes, not user-facing
    if (!req.user || ![UserRole.ADMIN].includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { merchantId } = req.params; // Note: param name kept for backward compatibility
    const { available, pending, reserve } = req.body;

    const balance = await Balance.findOne({ userId: merchantId });
    if (!balance) {
      res.status(404).json({ success: false, error: 'Balance not found' });
      return;
    }

    if (available !== undefined) balance.available = available;
    if (pending !== undefined) balance.pending = pending;
    if (reserve !== undefined) balance.reserve = reserve;
    balance.lastUpdated = new Date();

    await balance.save();

    res.json({ success: true, data: balance });
  } catch (error) {
    console.error('Update balance error:', error);
    res.status(500).json({ success: false, error: 'Failed to update balance' });
  }
};

