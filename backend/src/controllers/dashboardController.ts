import { Response } from 'express';
import { Transaction } from '../models/Transaction.js';
import { Balance } from '../models/Balance.js';
import { Merchant } from '../models/Merchant.js';
import { AuthRequest, UserRole, TransactionStatus } from '../types/index.js';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    let merchantId;
    if (req.user.role === UserRole.MERCHANT) {
      const merchant = await Merchant.findOne({ userId: req.user.id });
      if (!merchant) {
        res.status(404).json({ success: false, error: 'Merchant not found' });
        return;
      }
      merchantId = merchant._id;
    }

    const { startDate: startDateStr, endDate: endDateStr } = req.query;
    
    // Calculate date range
    let startDate: Date;
    let endDate: Date;
    
    if (startDateStr && typeof startDateStr === 'string') {
      startDate = new Date(startDateStr);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // Default to last 7 days if no start date provided
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    }
    
    if (endDateStr && typeof endDateStr === 'string') {
      endDate = new Date(endDateStr);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to today if no end date provided
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    // Build query
    const query: any = {
      createdAt: { $gte: startDate, $lte: endDate },
    };
    if (merchantId) {
      query.merchantId = merchantId;
    }

    // Get volume
    const volumeResult = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const volume = volumeResult.length > 0 ? volumeResult[0].totalVolume : 0;

    // Get approvals and declines
    const approvals = await Transaction.countDocuments({
      ...query,
      platformStatus: TransactionStatus.APPROVED,
    });

    const declines = await Transaction.countDocuments({
      ...query,
      platformStatus: TransactionStatus.REJECTED,
    });

    // Get pending reviews
    const pendingReviews = await Transaction.countDocuments({
      ...(merchantId ? { merchantId } : {}),
      platformStatus: TransactionStatus.PENDING_REVIEW,
    });

    // Get balance
    let balance = null;
    if (merchantId) {
      balance = await Balance.findOne({ merchantId });
      if (!balance) {
        // Create default balance if doesn't exist
        balance = await Balance.create({
          merchantId,
          available: 0,
          pending: 0,
          reserve: 0,
          currency: 'USD',
          pendingBreakdown: [],
        });
      }
    }

    res.json({
      success: true,
      data: {
        volume,
        approvals,
        declines,
        pendingReviews,
        availableBalance: balance?.available || 0,
        pendingBalance: balance?.pending || 0,
        reserveBalance: balance?.reserve || 0,
        currency: balance?.currency || 'USD',
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get dashboard stats' });
  }
};

export const getDashboardAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    let merchantId;
    if (req.user.role === UserRole.MERCHANT) {
      const merchant = await Merchant.findOne({ userId: req.user.id });
      if (!merchant) {
        res.status(404).json({ success: false, error: 'Merchant not found' });
        return;
      }
      merchantId = merchant._id;
    }

    const alerts = [];

    // Check for high-risk transactions
    const highRiskCount = await Transaction.countDocuments({
      ...(merchantId ? { merchantId } : {}),
      riskScore: { $gte: 70 },
      platformStatus: TransactionStatus.PENDING_REVIEW,
    });

    if (highRiskCount > 0) {
      alerts.push({
        id: 'high-risk',
        type: 'warning',
        message: `You have ${highRiskCount} high-risk transaction${highRiskCount > 1 ? 's' : ''} pending review`,
      });
    }

    // Check for pending merchant confirmations
    if (merchantId) {
      const pendingConfirmations = await Transaction.countDocuments({
        merchantId,
        merchantConfirmation: 'pending',
      });

      if (pendingConfirmations > 0) {
        alerts.push({
          id: 'pending-confirmations',
          type: 'info',
          message: `${pendingConfirmations} transaction${pendingConfirmations > 1 ? 's' : ''} awaiting your confirmation`,
        });
      }

      // Check balance
      const balance = await Balance.findOne({ merchantId });
      if (balance && balance.available > 1000) {
        alerts.push({
          id: 'balance-available',
          type: 'info',
          message: `You have available balance ready for withdrawal`,
        });
      }
    }

    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Get dashboard alerts error:', error);
    res.status(500).json({ success: false, error: 'Failed to get dashboard alerts' });
  }
};

export const getRecentTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    let merchantId;
    if (req.user.role === UserRole.MERCHANT) {
      const merchant = await Merchant.findOne({ userId: req.user.id });
      if (!merchant) {
        res.status(404).json({ success: false, error: 'Merchant not found' });
        return;
      }
      merchantId = merchant._id;
    }

    const query: any = {};
    if (merchantId) {
      query.merchantId = merchantId;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('transactionId customerInfo amount currency platformStatus createdAt');

    const formattedTransactions = transactions.map((txn) => ({
      id: txn.transactionId,
      customer: txn.customerInfo?.name || txn.customerInfo?.email || 'Unknown',
      amount: txn.amount,
      currency: txn.currency,
      status: txn.platformStatus,
      date: txn.createdAt.toISOString(),
    }));

    res.json({ success: true, data: formattedTransactions });
  } catch (error) {
    console.error('Get recent transactions error:', error);
    res.status(500).json({ success: false, error: 'Failed to get recent transactions' });
  }
};

