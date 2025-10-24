import { Balance } from '../models/Balance.js';
import { PaymentRequestStatus } from '../types/index.js';
import mongoose from 'mongoose';

/**
 * Updates merchant balance based on payment request status change
 * @param userId - The merchant's user ID
 * @param amount - The payment request amount
 * @param oldStatus - The previous payment request status
 * @param newStatus - The new payment request status
 */
export async function updateMerchantBalance(
  userId: string,
  amount: number,
  oldStatus: PaymentRequestStatus,
  newStatus: PaymentRequestStatus
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

  // Pending states: sent, viewed
  const isPendingStatus = (status: PaymentRequestStatus) =>
    status === PaymentRequestStatus.SENT || status === PaymentRequestStatus.VIEWED;

  // Remove old status effect
  if (oldStatus === PaymentRequestStatus.PAID) {
    balance.available -= amount;
  } else if (isPendingStatus(oldStatus)) {
    balance.pending -= amount;
  }

  // Apply new status effect
  if (newStatus === PaymentRequestStatus.PAID) {
    balance.available += amount;
  } else if (isPendingStatus(newStatus)) {
    balance.pending += amount;
  }

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

