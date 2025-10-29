import { v4 as uuidv4 } from 'uuid';
import { PaymentRequest } from '../models/PaymentRequest.js';
import { CardSubmission, CardSubmissionStatus } from '../models/CardSubmission.js';
import { Card } from '../models/Card.js';
import { PaymentRequestStatus, PaymentMethod } from '../types/index.js';
import { EncryptionService } from './encryptionService.js';
import { NotificationService } from './notificationService.js';
import { updateMerchantBalance } from './balanceService.js';

export interface CardSubmissionData {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvc: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PSPPaymentLinkData {
  token: string;
  link: string;
}

/**
 * Service class for PSP Card Payment operations
 * Handles business logic for card payment submissions and reviews
 */
export class PSPPaymentService {
  private encryptionService: EncryptionService;
  private notificationService: NotificationService;
  private readonly CARD_COMMISSION_PERCENT = 30;

  constructor(
    encryptionService: EncryptionService,
    notificationService: NotificationService
  ) {
    this.encryptionService = encryptionService;
    this.notificationService = notificationService;
  }

  /**
   * Generate unique PSP payment link for card payments
   */
  generatePaymentLink(): PSPPaymentLinkData {
    const token = uuidv4();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const link = `${frontendUrl}/pay/${token}`;

    return { token, link };
  }

  /**
   * Get commission percentage for card payments
   */
  getCardCommissionPercent(): number {
    return this.CARD_COMMISSION_PERCENT;
  }

  /**
   * Calculate commission and net amount
   */
  calculateCommission(amount: number): { commissionAmount: number; netAmount: number } {
    const commissionAmount = amount * (this.CARD_COMMISSION_PERCENT / 100);
    const netAmount = amount - commissionAmount;
    return { commissionAmount, netAmount };
  }

  /**
   * Find optional card reference for backward compatibility
   */
  async findCardReference(): Promise<string | undefined> {
    try {
      const card = await Card.findOne({ isActive: true });
      return card?._id.toString();
    } catch (error) {
      console.log('No Card record found, continuing without card association');
      return undefined;
    }
  }

  /**
   * Submit card payment - encrypt and store card data
   */
  async submitCardPayment(
    token: string,
    cardData: CardSubmissionData
  ): Promise<{ submissionId: string; paymentRequestId: string }> {
    // Find payment request by token
    const paymentRequest = await PaymentRequest.findOne({ pspPaymentToken: token });
    if (!paymentRequest) {
      throw new Error('Payment request not found');
    }

    // Check if already submitted
    const existingSubmission = await CardSubmission.findOne({
      paymentRequestId: paymentRequest._id,
    });
    if (existingSubmission) {
      throw new Error('Payment has already been submitted');
    }

    // Validate status
    if (paymentRequest.status !== PaymentRequestStatus.PENDING_SUBMISSION) {
      throw new Error('Payment request is not available for submission');
    }

    // Encrypt card data
    const encryptedCardData = this.encryptionService.encryptCardData({
      cardNumber: cardData.cardNumber,
      expiryDate: cardData.expiryDate,
      cvc: cardData.cvc,
    });

    // Create card submission
    const cardSubmission = await CardSubmission.create({
      paymentRequestId: paymentRequest._id,
      cardholderName: cardData.cardholderName,
      ...encryptedCardData,
      status: CardSubmissionStatus.SUBMITTED,
      submittedAt: new Date(),
      ipAddress: cardData.ipAddress,
      userAgent: cardData.userAgent,
    });

    // Update payment request status
    paymentRequest.status = PaymentRequestStatus.SUBMITTED;
    await paymentRequest.save();

    // Notify admin and merchant via WebSocket
    await this.notificationService.notifyPaymentSubmitted({
      paymentRequestId: paymentRequest._id.toString(),
      submissionId: cardSubmission._id.toString(),
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      merchantId: paymentRequest.userId.toString(),
      submittedAt: cardSubmission.submittedAt,
    });

    return {
      submissionId: cardSubmission._id.toString(),
      paymentRequestId: paymentRequest._id.toString(),
    };
  }

  /**
   * Review PSP payment - admin approval/rejection
   */
  async reviewPayment(
    submissionId: string,
    decision: 'processed' | 'processed_awaiting_exchange' | 'rejected' | 'insufficient_funds' | 'awaiting_3d_sms' | 'awaiting_3d_push'
  ): Promise<{ paymentRequestId: string; status: string }> {
    // Find card submission
    const cardSubmission = await CardSubmission.findById(submissionId);
    if (!cardSubmission) {
      throw new Error('Card submission not found');
    }

    // Check if already reviewed (allow submitted, verification_completed, or processed_awaiting_exchange)
    const allowedStatuses = [
      CardSubmissionStatus.SUBMITTED,
      CardSubmissionStatus.VERIFICATION_COMPLETED,
      CardSubmissionStatus.PROCESSED_AWAITING_EXCHANGE,
    ];
    if (!allowedStatuses.includes(cardSubmission.status)) {
      throw new Error('Payment has already been reviewed');
    }

    // Find payment request
    const paymentRequest = await PaymentRequest.findById(cardSubmission.paymentRequestId);
    if (!paymentRequest) {
      throw new Error('Payment request not found');
    }

    const oldStatus = paymentRequest.status;
    
    // Handle 3D verification requests differently
    if (decision === 'awaiting_3d_sms' || decision === 'awaiting_3d_push') {
      const verificationType = decision === 'awaiting_3d_sms' ? '3d_sms' : '3d_push';
      const newCardStatus = decision === 'awaiting_3d_sms' 
        ? CardSubmissionStatus.AWAITING_3D_SMS 
        : CardSubmissionStatus.AWAITING_3D_PUSH;
      
      // Update card submission to awaiting verification
      cardSubmission.status = newCardStatus;
      cardSubmission.verificationType = verificationType;
      await cardSubmission.save();
      
      // Update payment request status
      paymentRequest.status = newCardStatus as any;
      await paymentRequest.save();
      
      // Notify customer about verification request
      await this.notificationService.notifyVerificationRequested({
        paymentRequestId: paymentRequest._id.toString(),
        pspPaymentToken: paymentRequest.pspPaymentToken!,
        verificationType,
      });
      
      return {
        paymentRequestId: paymentRequest._id.toString(),
        status: newCardStatus,
      };
    }
    
    const newStatus = this.mapDecisionToStatus(decision);

    // Update card submission
    cardSubmission.status = newStatus as any;
    cardSubmission.reviewedAt = new Date();
    await cardSubmission.save();

    // Update payment request
    paymentRequest.status = newStatus;
    if (newStatus === PaymentRequestStatus.PROCESSED) {
      paymentRequest.paidAt = new Date();
    }
    await paymentRequest.save();

    // Update merchant balance based on status
    // PROCESSED_AWAITING_EXCHANGE: Money stays in pending balance (no action needed)
    // PROCESSED: Money moves from pending to available with commission deducted
    if (newStatus === PaymentRequestStatus.PROCESSED) {
      await updateMerchantBalance(
        paymentRequest.userId.toString(),
        paymentRequest.amount,
        oldStatus,
        newStatus,
        paymentRequest.netAmount
      );
    }

    // Notify customer and merchant
    await this.notificationService.notifyPaymentReviewed({
      paymentRequestId: paymentRequest._id.toString(),
      pspPaymentToken: paymentRequest.pspPaymentToken!,
      merchantId: paymentRequest.userId.toString(),
      status: newStatus,
      reviewedAt: cardSubmission.reviewedAt,
    });

    return {
      paymentRequestId: paymentRequest._id.toString(),
      status: newStatus,
    };
  }

  /**
   * Get decrypted card details (admin only)
   */
  async getDecryptedCardDetails(submissionId: string) {
    const cardSubmission = await CardSubmission.findById(submissionId);
    if (!cardSubmission) {
      throw new Error('Card submission not found');
    }

    const decryptedData = this.encryptionService.decryptCardData({
      cardNumberEncrypted: cardSubmission.cardNumberEncrypted,
      expiryDateEncrypted: cardSubmission.expiryDateEncrypted,
      cvcEncrypted: cardSubmission.cvcEncrypted,
    });

    return {
      ...decryptedData,
      cardNumberMasked: this.encryptionService.maskCardNumber(decryptedData.cardNumber),
      cardholderName: cardSubmission.cardholderName,
      status: cardSubmission.status,
      submittedAt: cardSubmission.submittedAt,
      reviewedAt: cardSubmission.reviewedAt,
      verificationType: cardSubmission.verificationType,
      verificationCompletedAt: cardSubmission.verificationCompletedAt,
      verificationCode: cardSubmission.verificationCode,
      verificationApproved: cardSubmission.verificationApproved,
      ipAddress: cardSubmission.ipAddress,
      userAgent: cardSubmission.userAgent,
    };
  }

  /**
   * Submit customer verification (SMS code or push notification approval)
   */
  async submitVerification(
    token: string,
    verificationData: { code?: string; approved?: boolean }
  ): Promise<{ success: boolean; paymentRequestId: string }> {
    // Find payment request by token
    const paymentRequest = await PaymentRequest.findOne({ pspPaymentToken: token });
    if (!paymentRequest) {
      throw new Error('Payment request not found');
    }

    // Find card submission
    const cardSubmission = await CardSubmission.findOne({
      paymentRequestId: paymentRequest._id,
    });
    if (!cardSubmission) {
      throw new Error('Card submission not found');
    }

    // Validate status
    const validStatuses = [
      CardSubmissionStatus.AWAITING_3D_SMS,
      CardSubmissionStatus.AWAITING_3D_PUSH,
    ];
    if (!validStatuses.includes(cardSubmission.status)) {
      throw new Error('Verification not required for this payment');
    }

    // Validate verification data based on type
    if (cardSubmission.status === CardSubmissionStatus.AWAITING_3D_SMS) {
      if (!verificationData.code) {
        throw new Error('Verification code is required');
      }
      // Store the SMS code
      cardSubmission.verificationCode = verificationData.code;
    } else if (cardSubmission.status === CardSubmissionStatus.AWAITING_3D_PUSH) {
      if (verificationData.approved === undefined) {
        throw new Error('Approval status is required');
      }
      if (!verificationData.approved) {
        throw new Error('Push notification was not approved');
      }
      // Store the approval status
      cardSubmission.verificationApproved = verificationData.approved;
    }

    // Update status to verification completed
    cardSubmission.status = CardSubmissionStatus.VERIFICATION_COMPLETED;
    cardSubmission.verificationCompletedAt = new Date();
    await cardSubmission.save();

    // Update payment request status
    paymentRequest.status = PaymentRequestStatus.VERIFICATION_COMPLETED as any;
    await paymentRequest.save();

    // Notify admin that customer completed verification
    await this.notificationService.notifyVerificationCompleted({
      paymentRequestId: paymentRequest._id.toString(),
      submissionId: cardSubmission._id.toString(),
      verificationType: cardSubmission.verificationType!,
      merchantId: paymentRequest.userId.toString(),
    });

    return {
      success: true,
      paymentRequestId: paymentRequest._id.toString(),
    };
  }

  /**
   * Map decision to payment request status
   */
  private mapDecisionToStatus(decision: string): PaymentRequestStatus {
    switch (decision) {
      case 'processed':
        return PaymentRequestStatus.PROCESSED;
      case 'processed_awaiting_exchange':
        return PaymentRequestStatus.PROCESSED_AWAITING_EXCHANGE;
      case 'rejected':
        return PaymentRequestStatus.REJECTED;
      case 'insufficient_funds':
        return PaymentRequestStatus.INSUFFICIENT_FUNDS;
      default:
        throw new Error(`Invalid decision: ${decision}`);
    }
  }
}

