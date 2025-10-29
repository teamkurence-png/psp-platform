import { Balance } from '../models/Balance.js';
import { PaymentRequestStatus } from '../types/index.js';
import mongoose from 'mongoose';

/**
 * Updates merchant balance based on payment request status change
 * @param userId - The merchant's user ID
 * @param amount - The payment request amount (for pending balance)
 * @param oldStatus - The previous payment request status
 * @param newStatus - The new payment request status
 * @param netAmount - The net amount after commission (used when marking as paid)
 */
export async function updateMerchantBalance(
  userId: string,
  amount: number,
  oldStatus: PaymentRequestStatus,
  newStatus: PaymentRequestStatus,
  netAmount?: number
): Promise<void> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  // Get or create balance
  let balance = await Balance.findOne({ userId: userObjectId });
  if (!balance) {
    balance = await Balance.create({
      userId: userObjectId,
      available: 0,
      pending: 0,
      currency: 'USD',
      pendingBreakdown: [],
    });
  }

  // Pending states: sent, viewed, pending_submission, submitted
  const isPendingStatus = (status: PaymentRequestStatus) =>
    status === PaymentRequestStatus.SENT || 
    status === PaymentRequestStatus.VIEWED ||
    status === PaymentRequestStatus.PENDING_SUBMISSION ||
    status === PaymentRequestStatus.SUBMITTED;

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
  } else if (isPendingStatus(newStatus)) {
    // Keep in pending balance
    balance.pending += effectiveAmount;
  }
  // For rejected/cancelled/expired/insufficient_funds - don't add to either balance

  balance.lastUpdated = new Date();
  await balance.save();
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
      currency,
      pendingBreakdown: [],
    });
  }
  return balance;
}

