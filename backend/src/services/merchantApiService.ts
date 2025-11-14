import { PaymentRequest } from '../models/PaymentRequest.js';
import { BankAccount } from '../models/BankAccount.js';
import { PaymentMethod, BankRail, PaymentRequestStatus } from '../types/index.js';
import { 
  ApiPaymentRequestInput, 
  ApiPaymentRequestResponse,
  ApiListResponse 
} from '../types/api.js';
import { generateReason } from '../utils/generators.js';
import { addToPendingBalance, updateMerchantBalance } from './balanceService.js';
import { PSPPaymentService } from './pspPaymentService.js';
import { EncryptionService } from './encryptionService.js';
import { notificationService } from './notificationService.js';
import { commissionService } from './commissionService.js';

export class MerchantApiService {
  private pspPaymentService: PSPPaymentService;

  constructor() {
    const encryptionService = new EncryptionService();
    this.pspPaymentService = new PSPPaymentService(encryptionService, notificationService);
  }

  /**
   * Create a payment request via API
   * @param userId - Merchant user ID
   * @param input - Payment request input data
   * @returns Created payment request
   */
  async createPaymentRequest(
    userId: string,
    input: ApiPaymentRequestInput
  ): Promise<ApiPaymentRequestResponse> {
    // Pre-validate availability of payment processors
    const unavailableMethods: string[] = [];

    // Check bank availability if bank wire is requested
    if (input.paymentMethods.includes(PaymentMethod.BANK_WIRE)) {
      const customerGeo = input.customerInfo.billingCountry;
      
      const availableBanks = await BankAccount.find({
        supportedGeos: customerGeo,
        isActive: true,
        minTransactionLimit: { $lte: input.amount },
        maxTransactionLimit: { $gte: input.amount },
      });

      if (availableBanks.length === 0) {
        const banksForGeo = await BankAccount.find({
          supportedGeos: customerGeo,
          isActive: true,
        });

        if (banksForGeo.length === 0) {
          unavailableMethods.push(
            `Bank Wire (no active bank accounts available for ${customerGeo})`
          );
        } else {
          unavailableMethods.push(
            `Bank Wire (amount $${input.amount} is outside the transaction limits of available banks for ${customerGeo})`
          );
        }
      }
    }

    // Validate card payment limit
    if (input.paymentMethods.includes(PaymentMethod.CARD)) {
      const CARD_PAYMENT_LIMIT = 250;
      if (input.amount > CARD_PAYMENT_LIMIT) {
        throw new Error(
          `Card payments are limited to a maximum of $${CARD_PAYMENT_LIMIT} USD. For higher amounts, please use Bank Wire Transfer.`
        );
      }
    }

    // If any payment methods don't have available processors, throw error
    if (unavailableMethods.length > 0) {
      throw new Error(
        `No suitable payment processors available. The following methods cannot be used: ${unavailableMethods.join(', ')}.`
      );
    }

    // Auto-assign bank or card based on payment method
    let reason;
    let bankDetails;
    let bankAccountId;
    let cardId;
    let commissionPercent = 0;

    // Handle Bank Wire auto-assignment
    if (input.paymentMethods.includes(PaymentMethod.BANK_WIRE)) {
      reason = generateReason();
      const customerGeo = input.customerInfo.billingCountry;

      const availableBanks = await BankAccount.find({
        supportedGeos: customerGeo,
        isActive: true,
        minTransactionLimit: { $lte: input.amount },
        maxTransactionLimit: { $gte: input.amount },
      });

      // Randomly select a bank
      const selectedBank = availableBanks[Math.floor(Math.random() * availableBanks.length)];
      bankAccountId = selectedBank._id;
      commissionPercent = selectedBank.commissionPercent;

      // Populate bank details
      bankDetails = {
        rails: [BankRail.SWIFT],
        beneficiaryName: selectedBank.beneficiaryName,
        iban: selectedBank.iban,
        accountNumber: selectedBank.accountNumber,
        routingNumber: selectedBank.routingNumber,
        swiftCode: selectedBank.swiftCode,
        bankName: selectedBank.bankName,
        bankAddress: selectedBank.bankAddress,
      };
    }

    // Handle Card payment - generate dynamic PSP link
    let pspPaymentToken;
    let pspPaymentLink;
    let initialStatus = PaymentRequestStatus.SENT;
    let commissionResult;

    if (input.paymentMethods.includes(PaymentMethod.CARD)) {
      commissionResult = commissionService.calculate(input.amount, PaymentMethod.CARD);
      commissionPercent = commissionResult.commissionPercent;

      const pspLinkData = this.pspPaymentService.generatePaymentLink();
      pspPaymentToken = pspLinkData.token;
      pspPaymentLink = pspLinkData.link;

      initialStatus = PaymentRequestStatus.PENDING_SUBMISSION;
      cardId = await this.pspPaymentService.findCardReference();
    } else {
      commissionResult = commissionService.calculate(
        input.amount,
        PaymentMethod.BANK_WIRE,
        commissionPercent
      );
    }

    const commissionAmount = commissionResult.commissionAmount;
    const netAmount = commissionResult.netAmount;

    // Create payment request
    const paymentRequest = await PaymentRequest.create({
      userId,
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      invoiceNumber: input.invoiceNumber,
      dueDate: input.dueDate,
      customerReference: input.customerReference,
      customerInfo: input.customerInfo,
      paymentMethods: input.paymentMethods,
      status: initialStatus,
      bankAccountId,
      cardId,
      bankDetails,
      reason,
      pspPaymentToken,
      pspPaymentLink,
      commissionPercent,
      commissionAmount,
      netAmount,
      callbackUrl: input.callbackUrl,
    });

    // Add net amount to pending balance
    await addToPendingBalance(userId, netAmount, input.currency);

    // Notify admin of new payment request via WebSocket
    await notificationService.notifyPaymentRequestCreated({
      paymentRequestId: (paymentRequest._id as any).toString(),
      merchantId: userId,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      paymentMethods: paymentRequest.paymentMethods,
      status: paymentRequest.status,
      createdAt: paymentRequest.createdAt,
    });

    return this.formatPaymentRequestResponse(paymentRequest);
  }

  /**
   * List payment requests for a merchant
   * @param userId - Merchant user ID
   * @param options - Query options (pagination, filters)
   * @returns List of payment requests with pagination
   */
  async listPaymentRequests(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ApiListResponse<ApiPaymentRequestResponse>> {
    const { page = 1, limit = 10, status, startDate, endDate } = options;

    const query: any = { userId };

    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const paymentRequests = await PaymentRequest.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await PaymentRequest.countDocuments(query);

    return {
      items: paymentRequests.map(pr => this.formatPaymentRequestResponse(pr)),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Get a single payment request by ID
   * @param paymentRequestId - Payment request ID
   * @param userId - Merchant user ID (for authorization)
   * @returns Payment request or null
   */
  async getPaymentRequest(
    paymentRequestId: string,
    userId: string
  ): Promise<ApiPaymentRequestResponse | null> {
    const paymentRequest = await PaymentRequest.findOne({
      _id: paymentRequestId,
      userId,
    });

    if (!paymentRequest) {
      return null;
    }

    return this.formatPaymentRequestResponse(paymentRequest);
  }

  /**
   * Cancel a payment request
   * @param paymentRequestId - Payment request ID
   * @param userId - Merchant user ID (for authorization)
   * @returns Updated payment request or null
   */
  async cancelPaymentRequest(
    paymentRequestId: string,
    userId: string
  ): Promise<ApiPaymentRequestResponse | null> {
    const paymentRequest = await PaymentRequest.findOne({
      _id: paymentRequestId,
      userId,
    });

    if (!paymentRequest) {
      return null;
    }

    const oldStatus = paymentRequest.status;
    paymentRequest.status = PaymentRequestStatus.CANCELLED;
    await paymentRequest.save();

    // Update balance when cancelling
    await updateMerchantBalance(
      userId,
      paymentRequest.amount,
      oldStatus,
      PaymentRequestStatus.CANCELLED,
      paymentRequest.netAmount
    );

    // Trigger webhook notification (async, don't wait)
    const { webhookService } = await import('./webhookService.js');
    webhookService.notifyPaymentStatusChange(paymentRequest).catch(err => {
      console.error('Webhook notification error:', err);
    });

    return this.formatPaymentRequestResponse(paymentRequest);
  }

  /**
   * Format payment request for API response
   * @param paymentRequest - Payment request document
   * @returns Formatted API response
   */
  private formatPaymentRequestResponse(paymentRequest: any): ApiPaymentRequestResponse {
    return {
      id: paymentRequest._id.toString(),
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      description: paymentRequest.description,
      invoiceNumber: paymentRequest.invoiceNumber,
      dueDate: paymentRequest.dueDate,
      status: paymentRequest.status,
      paymentMethods: paymentRequest.paymentMethods,
      paymentLink: paymentRequest.pspPaymentLink,
      bankDetails: paymentRequest.bankDetails,
      reason: paymentRequest.reason,
      customerInfo: paymentRequest.customerInfo,
      commissionPercent: paymentRequest.commissionPercent,
      commissionAmount: paymentRequest.commissionAmount,
      netAmount: paymentRequest.netAmount,
      createdAt: paymentRequest.createdAt,
      updatedAt: paymentRequest.updatedAt,
    };
  }
}

// Export singleton instance
export const merchantApiService = new MerchantApiService();

