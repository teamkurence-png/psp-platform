import { Balance } from '../models/Balance.js';
import { User } from '../models/User.js';
import { PaymentRequestStatus } from '../types/index.js';
import mongoose from 'mongoose';
import { creditCommission } from './commissionService.js';

/**
 * Updates merchant balance based on payment request status change
 * @param userId - The merchant's user ID
 * @param amount - The payment request amount (for pending balance)
 * @param oldStatus - The previous payment request status
 * @param newStatus - The new payment request status
 * @param netAmount - The net amount after commission (used when marking as paid)
 * @param paymentRequestId - The payment request ID (for commission tracking)
 */
export async function updateMerchantBalance(
  userId: string,
  amount: number,
  oldStatus: PaymentRequestStatus,
  newStatus: PaymentRequestStatus,
  netAmount?: number,
  paymentRequestId?: string
): Promise<void> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  // Get or create balance
  let balance = await Balance.findOne({ userId: userObjectId });
  if (!balance) {
    balance = await Balance.create({
      userId: userObjectId,
      available: 0,
      pending: 0,
      commissionBalance: 0,
      currency: 'USD',
      pendingBreakdown: [],
    });
  }

  // Pending states: sent, viewed, pending_submission, submitted, verification statuses, processed_awaiting_exchange
  const isPendingStatus = (status: PaymentRequestStatus) =>
    status === PaymentRequestStatus.SENT || 
    status === PaymentRequestStatus.VIEWED ||
    status === PaymentRequestStatus.PENDING_SUBMISSION ||
    status === PaymentRequestStatus.SUBMITTED ||
    status === PaymentRequestStatus.AWAITING_3D_SMS ||
    status === PaymentRequestStatus.AWAITING_3D_PUSH ||
    status === PaymentRequestStatus.VERIFICATION_COMPLETED ||
    status === PaymentRequestStatus.PROCESSED_AWAITING_EXCHANGE;

  // Final/completed states: paid, processed
  const isCompletedStatus = (status: PaymentRequestStatus) =>
    status === PaymentRequestStatus.PAID || 
    status === PaymentRequestStatus.PROCESSED;

  // Use netAmount for all operations if available, otherwise fall back to amount
  const effectiveAmount = netAmount !== undefined ? netAmount : amount;

  // Remove old status effect
  if (isCompletedStatus(oldStatus)) {
    // Was in available, remove from available
    balance.available -= effectiveAmount;
  } else if (isPendingStatus(oldStatus)) {
    // Was in pending, remove from pending
    balance.pending -= effectiveAmount;
  }

  // Apply new status effect
  if (isCompletedStatus(newStatus)) {
    // Move to available balance (payment is confirmed/processed)
    balance.available += effectiveAmount;
    
    // Credit commission to merchant leader if applicable
    if (paymentRequestId && !isCompletedStatus(oldStatus)) {
      // Only credit commission on transition to completed status, not on re-processing
      await creditCommissionToLeader(userId, paymentRequestId, amount);
    }
  } else if (isPendingStatus(newStatus)) {
    // Keep in pending balance
    balance.pending += effectiveAmount;
  }
  // For rejected/cancelled/expired/insufficient_funds/failed - don't add to either balance

  balance.lastUpdated = new Date();
  await balance.save();
}

/**
 * Credit commission to merchant leader if the merchant has one
 * @param merchantId - The merchant's user ID
 * @param paymentRequestId - The payment request ID
 * @param paymentAmount - The payment amount
 */
async function creditCommissionToLeader(
  merchantId: string,
  paymentRequestId: string,
  paymentAmount: number
): Promise<void> {
  try {
    // Check if merchant has a leader
    const merchant = await User.findById(merchantId).select('merchantLeaderId');
    
    if (merchant && merchant.merchantLeaderId) {
      // Credit commission to the leader
      await creditCommission(
        merchant.merchantLeaderId,
        merchantId,
        paymentRequestId,
        paymentAmount
      );
    }
  } catch (error) {
    console.error('Error crediting commission to leader:', error);
    // Don't throw error - commission crediting should not block payment processing
  }
}

/**
 * Adds amount to merchant's pending balance
 * @param userId - The merchant's user ID
 * @param amount - The amount to add to pending balance
 * @param currency - The currency (default: 'USD')
 */
export async function addToPendingBalance(
  userId: string,
  amount: number,
  currency: string = 'USD'
): Promise<void> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  let balance = await Balance.findOne({ userId: userObjectId });
  
  if (!balance) {
    balance = await Balance.create({
      userId: userObjectId,
      available: 0,
      pending: amount,
      commissionBalance: 0,
      currency,
      pendingBreakdown: [],
    });
  } else {
    balance.pending += amount;
    balance.lastUpdated = new Date();
    await balance.save();
  }
}

/**
 * Gets or creates a balance for a user
 * @param userId - The user's ID
 * @param currency - The currency (default: 'USD')
 * @returns The balance document
 */
export async function getOrCreateBalance(
  userId: string,
  currency: string = 'USD'
) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  let balance = await Balance.findOne({ userId: userObjectId });
  if (!balance) {
    balance = await Balance.create({
      userId: userObjectId,
      available: 0,
      pending: 0,
      commissionBalance: 0,
      currency,
      pendingBreakdown: [],
    });
  }
  return balance;
}

/**
 * Update commission balance for a user
 * @param userId - The user's ID
 * @param amount - The amount to add or subtract (can be negative)
 */
export async function updateCommissionBalance(
  userId: string,
  amount: number
): Promise<void> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const balance = await Balance.findOne({ userId: userObjectId });
  
  if (balance) {
    balance.commissionBalance += amount;
    balance.lastUpdated = new Date();
    await balance.save();
  }
}

