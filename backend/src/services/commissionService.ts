import mongoose from 'mongoose';
import { Commission } from '../models/Commission.js';
import { Balance } from '../models/Balance.js';
import { CommissionStatus } from '../types/index.js';

/**
 * Commission rate for merchant leaders (5%)
 */
export const COMMISSION_RATE = 0.05;

/**
 * Calculate commission amount based on payment amount
 * @param amount - The payment amount
 * @returns The calculated commission (5% of amount)
 */
export function calculateCommission(amount: number): number {
  return Math.round(amount * COMMISSION_RATE * 100) / 100; // Round to 2 decimal places
}

/**
 * Credit commission to merchant leader's balance
 * @param leaderId - The merchant leader's user ID
 * @param merchantId - The merchant who generated the payment
 * @param paymentRequestId - The payment request ID
 * @param paymentAmount - The original payment amount
 * @param currency - The currency (default: 'USD')
 */
export async function creditCommission(
  leaderId: string | mongoose.Types.ObjectId,
  merchantId: string | mongoose.Types.ObjectId,
  paymentRequestId: string | mongoose.Types.ObjectId,
  paymentAmount: number,
  currency: string = 'USD'
): Promise<void> {
  const leaderObjectId = typeof leaderId === 'string' ? new mongoose.Types.ObjectId(leaderId) : leaderId;
  const merchantObjectId = typeof merchantId === 'string' ? new mongoose.Types.ObjectId(merchantId) : merchantId;
  const paymentRequestObjectId = typeof paymentRequestId === 'string' ? new mongoose.Types.ObjectId(paymentRequestId) : paymentRequestId;

  // Calculate commission amount
  const commissionAmount = calculateCommission(paymentAmount);

  // Create commission record
  await Commission.create({
    userId: leaderObjectId,
    merchantId: merchantObjectId,
    paymentRequestId: paymentRequestObjectId,
    amount: commissionAmount,
    paymentAmount,
    currency,
    status: CommissionStatus.CREDITED,
    creditedAt: new Date(),
  });

  // Update leader's commission balance
  const balance = await Balance.findOne({ userId: leaderObjectId });
  if (balance) {
    balance.commissionBalance += commissionAmount;
    balance.lastUpdated = new Date();
    await balance.save();
  } else {
    // Create balance if it doesn't exist (shouldn't happen for merchant leaders)
    await Balance.create({
      userId: leaderObjectId,
      available: 0,
      pending: 0,
      commissionBalance: commissionAmount,
      currency,
      pendingBreakdown: [],
    });
  }
}

/**
 * Get commission history for a merchant leader
 * @param leaderId - The merchant leader's user ID
 * @param filters - Optional filters (status, merchantId, page, limit)
 * @returns Commission records with pagination
 */
export async function getLeaderCommissions(
  leaderId: string,
  filters: {
    status?: CommissionStatus;
    merchantId?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  commissions: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  const { status, merchantId, page = 1, limit = 20 } = filters;
  
  const query: any = { userId: new mongoose.Types.ObjectId(leaderId) };
  
  if (status) {
    query.status = status;
  }
  
  if (merchantId) {
    query.merchantId = new mongoose.Types.ObjectId(merchantId);
  }

  const commissions = await Commission.find(query)
    .populate('merchantId', 'legalName email supportEmail')
    .populate('paymentRequestId', 'invoiceNumber amount status')
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ createdAt: -1 });

  const total = await Commission.countDocuments(query);

  return {
    commissions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  };
}

/**
 * Get commission statistics for a merchant leader
 * @param leaderId - The merchant leader's user ID
 * @returns Aggregated commission statistics
 */
export async function getCommissionStats(leaderId: string): Promise<{
  totalCommission: number;
  totalPayments: number;
  commissionByMonth: any[];
}> {
  const leaderObjectId = new mongoose.Types.ObjectId(leaderId);

  // Get total commission
  const totalStats = await Commission.aggregate([
    {
      $match: {
        userId: leaderObjectId,
        status: CommissionStatus.CREDITED,
      },
    },
    {
      $group: {
        _id: null,
        totalCommission: { $sum: '$amount' },
        totalPayments: { $count: {} },
      },
    },
  ]);

  // Get commission by month (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const commissionByMonth = await Commission.aggregate([
    {
      $match: {
        userId: leaderObjectId,
        status: CommissionStatus.CREDITED,
        createdAt: { $gte: twelveMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        totalCommission: { $sum: '$amount' },
        count: { $count: {} },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 },
    },
  ]);

  return {
    totalCommission: totalStats.length > 0 ? totalStats[0].totalCommission : 0,
    totalPayments: totalStats.length > 0 ? totalStats[0].totalPayments : 0,
    commissionByMonth,
  };
}

// Export as a service object as well for consistency
export const commissionService = {
  calculateCommission,
  creditCommission,
  getLeaderCommissions,
  getCommissionStats,
};
