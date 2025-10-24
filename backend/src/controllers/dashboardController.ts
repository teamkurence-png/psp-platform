import { Response } from 'express';
import { PaymentRequest } from '../models/PaymentRequest.js';
import { Balance } from '../models/Balance.js';
import { AuthRequest, UserRole, PaymentRequestStatus } from '../types/index.js';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    let userId;
    if (req.user.role === UserRole.MERCHANT) {
      userId = req.user.id;
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
    if (userId) {
      query.userId = userId;
    }

    // Get volume - sum of all paid payment requests in date range
    const volumeResult = await PaymentRequest.aggregate([
      { 
        $match: {
          ...query,
          status: PaymentRequestStatus.PAID,
        }
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const volume = volumeResult.length > 0 ? volumeResult[0].totalVolume : 0;

    // Get approvals (paid) and declines (cancelled/expired)
    const approvals = await PaymentRequest.countDocuments({
      ...query,
      status: PaymentRequestStatus.PAID,
    });

    const declines = await PaymentRequest.countDocuments({
      ...query,
      status: { $in: [PaymentRequestStatus.CANCELLED, PaymentRequestStatus.EXPIRED] },
    });

    // Get pending reviews (sent and viewed payment requests)
    const pendingReviews = await PaymentRequest.countDocuments({
      ...(userId ? { userId } : {}),
      status: { $in: [PaymentRequestStatus.SENT, PaymentRequestStatus.VIEWED] },
    });

    // Get balance
    let balance = null;
    if (userId) {
      balance = await Balance.findOne({ userId });
      if (!balance) {
        // Create default balance if doesn't exist
        balance = await Balance.create({
          userId,
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

    let userId;
    if (req.user.role === UserRole.MERCHANT) {
      userId = req.user.id;
    }

    const alerts = [];

    // Check for pending payment requests
    if (userId) {
      const pendingCount = await PaymentRequest.countDocuments({
        userId,
        status: { $in: [PaymentRequestStatus.SENT, PaymentRequestStatus.VIEWED] },
      });

      if (pendingCount > 0) {
        alerts.push({
          id: 'pending-payments',
          type: 'info',
          message: `You have ${pendingCount} payment request${pendingCount > 1 ? 's' : ''} awaiting payment`,
        });
      }

      // Check for expiring payment requests (due in next 3 days)
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      
      const expiringCount = await PaymentRequest.countDocuments({
        userId,
        status: { $in: [PaymentRequestStatus.SENT, PaymentRequestStatus.VIEWED] },
        dueDate: { $lte: threeDaysFromNow, $gte: new Date() },
      });

      if (expiringCount > 0) {
        alerts.push({
          id: 'expiring-requests',
          type: 'warning',
          message: `${expiringCount} payment request${expiringCount > 1 ? 's are' : ' is'} expiring soon`,
        });
      }

      // Check balance
      const balance = await Balance.findOne({ userId });
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

