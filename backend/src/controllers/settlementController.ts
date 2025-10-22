import { Response } from 'express';
import { z } from 'zod';
import { Settlement } from '../models/Settlement.js';
import { Balance } from '../models/Balance.js';
import { Merchant } from '../models/Merchant.js';
import { Transaction } from '../models/Transaction.js';
import { AuthRequest, UserRole, TransactionStatus } from '../types/index.js';

// Validation schema
const createSettlementSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  method: z.enum(['bank_transfer', 'crypto']),
  destination: z.string(),
  transactionIds: z.array(z.string()).optional(),
});

export const createSettlement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.MERCHANT) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const merchant = await Merchant.findOne({ userId: req.user.id });
    if (!merchant) {
      res.status(404).json({ success: false, error: 'Merchant not found' });
      return;
    }

    const validatedData = createSettlementSchema.parse(req.body);

    // Check balance
    const balance = await Balance.findOne({ merchantId: merchant._id });
    if (!balance || balance.available < validatedData.amount) {
      res.status(400).json({ 
        success: false, 
        error: 'Insufficient available balance' 
      });
      return;
    }

    // Generate settlement ID
    const settlementId = `STL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Get transaction IDs or find settled transactions
    let transactionIds = validatedData.transactionIds || [];
    if (transactionIds.length === 0) {
      const settledTransactions = await Transaction.find({
        merchantId: merchant._id,
        platformStatus: TransactionStatus.SETTLED,
        settledAt: { $exists: true },
      })
        .sort({ settledAt: -1 })
        .limit(100)
        .select('_id');
      
      transactionIds = settledTransactions.map(t => t._id.toString());
    }

    // Create settlement
    const settlement = await Settlement.create({
      settlementId,
      merchantId: merchant._id,
      ...validatedData,
      transactionIds,
      status: 'pending',
    });

    // Update balance (deduct from available, will be moved back if settlement fails)
    balance.available -= validatedData.amount;
    await balance.save();

    res.status(201).json({ 
      success: true, 
      message: 'Settlement initiated',
      data: settlement 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    console.error('Create settlement error:', error);
    res.status(500).json({ success: false, error: 'Failed to create settlement' });
  }
};

export const listSettlements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { status, method, page = 1, limit = 10 } = req.query;
    let query: any = {};

    // For merchants, only show their own settlements
    if (req.user.role === UserRole.MERCHANT) {
      const merchant = await Merchant.findOne({ userId: req.user.id });
      if (!merchant) {
        res.status(404).json({ success: false, error: 'Merchant not found' });
        return;
      }
      query.merchantId = merchant._id;
    } else if (req.query.merchantId) {
      // For ops/admin, allow filtering by merchantId
      query.merchantId = req.query.merchantId;
    }

    // Apply filters
    if (status) query.status = status;
    if (method) query.method = method;

    const settlements = await Settlement.find(query)
      .populate('merchantId', 'legalName supportEmail')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Settlement.countDocuments(query);

    res.json({
      success: true,
      data: {
        settlements,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('List settlements error:', error);
    res.status(500).json({ success: false, error: 'Failed to list settlements' });
  }
};

export const getSettlement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const settlement = await Settlement.findById(id)
      .populate('merchantId', 'legalName supportEmail')
      .populate('transactionIds');

    if (!settlement) {
      res.status(404).json({ success: false, error: 'Settlement not found' });
      return;
    }

    // Check authorization
    if (req.user.role === UserRole.MERCHANT) {
      const merchant = await Merchant.findOne({ userId: req.user.id });
      if (!merchant || settlement.merchantId._id.toString() !== merchant._id.toString()) {
        res.status(403).json({ success: false, error: 'Forbidden' });
        return;
      }
    }

    res.json({ success: true, data: settlement });
  } catch (error) {
    console.error('Get settlement error:', error);
    res.status(500).json({ success: false, error: 'Failed to get settlement' });
  }
};

export const updateSettlementStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || ![UserRole.FINANCE, UserRole.ADMIN].includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const { status, failureReason } = req.body;

    if (!['processing', 'completed', 'failed'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }

    const settlement = await Settlement.findById(id);
    if (!settlement) {
      res.status(404).json({ success: false, error: 'Settlement not found' });
      return;
    }

    settlement.status = status;
    
    if (status === 'completed') {
      settlement.settledAt = new Date();
    } else if (status === 'failed') {
      settlement.failureReason = failureReason;
      
      // Return amount to balance
      const balance = await Balance.findOne({ merchantId: settlement.merchantId });
      if (balance) {
        balance.available += settlement.amount;
        await balance.save();
      }
    }

    await settlement.save();

    res.json({ 
      success: true, 
      message: `Settlement ${status}`,
      data: settlement 
    });
  } catch (error) {
    console.error('Update settlement status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update settlement status' });
  }
};

