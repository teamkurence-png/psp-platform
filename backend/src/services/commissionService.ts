import { PaymentMethod } from '../types/index.js';

export interface CommissionResult {
  commissionPercent: number;
  commissionAmount: number;
  netAmount: number;
}

/**
 * Service class for calculating payment commissions
 * Centralizes commission calculation logic
 */
export class CommissionService {
  private readonly CARD_COMMISSION_PERCENT = 30;

  /**
   * Calculate commission for a payment
   */
  calculate(amount: number, method: PaymentMethod, customPercent?: number): CommissionResult {
    let commissionPercent = 0;

    if (method === PaymentMethod.CARD) {
      // Card payments have a fixed 30% commission
      commissionPercent = this.CARD_COMMISSION_PERCENT;
    } else if (customPercent !== undefined) {
      // For bank wire or other methods, use the provided percent
      commissionPercent = customPercent;
    }

    const commissionAmount = amount * (commissionPercent / 100);
    const netAmount = amount - commissionAmount;

    return {
      commissionPercent,
      commissionAmount,
      netAmount,
    };
  }

  /**
   * Get card commission percentage
   */
  getCardCommissionPercent(): number {
    return this.CARD_COMMISSION_PERCENT;
  }
}

// Singleton instance
export const commissionService = new CommissionService();

