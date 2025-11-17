import { Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { PaymentRequest } from '../models/PaymentRequest.js';
import { Balance } from '../models/Balance.js';
import { Commission } from '../models/Commission.js';
import { AuthRequest, UserRole, PaymentRequestStatus } from '../types/index.js';
import { getLeaderCommissions, getCommissionStats } from '../services/commissionService.js';

/**
 * Get merchant leader dashboard with aggregated stats
 */
export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.MERCHANT) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const leaderObjectId = new mongoose.Types.ObjectId(req.user.id);

    // Verify user is a merchant leader
    const leader = await User.findById(leaderObjectId).select('isMerchantLeader');
    if (!leader || !leader.isMerchantLeader) {
      res.status(403).json({ success: false, error: 'Access denied. Merchant leader status required.' });
      return;
    }

    // Get group merchants count
    const groupMerchantsCount = await User.countDocuments({
      merchantLeaderId: leaderObjectId,
      role: UserRole.MERCHANT,
      isActive: true,
    });

    // Get group payment requests stats
    const groupMerchants = await User.find({
      merchantLeaderId: leaderObjectId,
      role: UserRole.MERCHANT,
    }).select('_id');

    const groupMerchantIds = groupMerchants.map(m => m._id);

    const paymentRequestStats = await PaymentRequest.aggregate([
      {
        $match: {
          userId: { $in: groupMerchantIds },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $count: {} },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    // Get total payment requests
    const totalPaymentRequests = await PaymentRequest.countDocuments({
      userId: { $in: groupMerchantIds },
    });

    // Get recent payment requests from group
    const recentPaymentRequests = await PaymentRequest.find({
      userId: { $in: groupMerchantIds },
    })
      .populate('userId', 'legalName email supportEmail')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get commission stats
    const commissionStats = await getCommissionStats(req.user.id);

    // Get leader's balance (commission balance)
    const balance = await Balance.findOne({ userId: leaderObjectId }).select('commissionBalance currency');

    res.json({
      success: true,
      data: {
        groupMerchantsCount,
        totalPaymentRequests,
        paymentRequestStats,
        recentPaymentRequests,
        commissionStats,
        commissionBalance: balance?.commissionBalance || 0,
        currency: balance?.currency || 'USD',
      },
    });
  } catch (error) {
    console.error('Get merchant leader dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to load dashboard' });
  }
};

/**
 * Get all merchants in the leader's group
 */
export const getGroupMerchants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.MERCHANT) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const leaderObjectId = new mongoose.Types.ObjectId(req.user.id);

    // Verify user is a merchant leader
    const leader = await User.findById(leaderObjectId).select('isMerchantLeader');
    if (!leader || !leader.isMerchantLeader) {
      res.status(403).json({ success: false, error: 'Access denied. Merchant leader status required.' });
      return;
    }

    const { page = 1, limit = 20, status } = req.query;
    const query: any = {
      merchantLeaderId: leaderObjectId,
      role: UserRole.MERCHANT,
    };

    if (status) {
      query.onboardingStatus = status;
    }

    const merchants = await User.find(query)
      .select('-password -refreshToken -twoFactorSecret')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    // Get payment request counts for each merchant
    const merchantsWithStats = await Promise.all(
      merchants.map(async (merchant) => {
        const paymentRequestCount = await PaymentRequest.countDocuments({
          userId: merchant._id,
        });

        const completedPaymentCount = await PaymentRequest.countDocuments({
          userId: merchant._id,
          status: { $in: [PaymentRequestStatus.PAID, PaymentRequestStatus.PROCESSED] },
        });

        return {
          ...merchant.toObject(),
          paymentRequestCount,
          completedPaymentCount,
        };
      })
    );

    res.json({
      success: true,
      data: {
        merchants: merchantsWithStats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get group merchants error:', error);
    res.status(500).json({ success: false, error: 'Failed to load group merchants' });
  }
};

/**
 * Get all payment requests from group merchants
 */
export const getGroupPaymentRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.MERCHANT) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const leaderObjectId = new mongoose.Types.ObjectId(req.user.id);

    // Verify user is a merchant leader
    const leader = await User.findById(leaderObjectId).select('isMerchantLeader');
    if (!leader || !leader.isMerchantLeader) {
      res.status(403).json({ success: false, error: 'Access denied. Merchant leader status required.' });
      return;
    }

    const { page = 1, limit = 20, status, merchantId } = req.query;

    // Get all merchants in the group
    const groupQuery: any = {
      merchantLeaderId: leaderObjectId,
      role: UserRole.MERCHANT,
    };

    if (merchantId) {
      groupQuery._id = new mongoose.Types.ObjectId(merchantId as string);
    }

    const groupMerchants = await User.find(groupQuery).select('_id');
    const groupMerchantIds = groupMerchants.map(m => m._id);

    // Get payment requests from group merchants
    const paymentRequestQuery: any = {
      userId: { $in: groupMerchantIds },
    };

    if (status) {
      paymentRequestQuery.status = status;
    }

    const paymentRequests = await PaymentRequest.find(paymentRequestQuery)
      .populate('userId', 'legalName email supportEmail')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await PaymentRequest.countDocuments(paymentRequestQuery);

    res.json({
      success: true,
      data: {
        paymentRequests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get group payment requests error:', error);
    res.status(500).json({ success: false, error: 'Failed to load group payment requests' });
  }
};

/**
 * Get commission history for the merchant leader
 */
export const getCommissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.MERCHANT) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    // Verify user is a merchant leader
    const leader = await User.findById(req.user.id).select('isMerchantLeader');
    if (!leader || !leader.isMerchantLeader) {
      res.status(403).json({ success: false, error: 'Access denied. Merchant leader status required.' });
      return;
    }

    const { status, merchantId, page, limit } = req.query;

    const result = await getLeaderCommissions(req.user.id, {
      status: status as any,
      merchantId: merchantId as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get commissions error:', error);
    res.status(500).json({ success: false, error: 'Failed to load commissions' });
  }
};

