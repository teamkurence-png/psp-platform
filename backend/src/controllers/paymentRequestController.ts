import { Response } from 'express';
import { z } from 'zod';
import { PaymentRequest } from '../models/PaymentRequest.js';
import { BankAccount } from '../models/BankAccount.js';
import { AuthRequest, UserRole, PaymentMethod, BankRail, PaymentRequestStatus } from '../types/index.js';
import { generateReason } from '../utils/generators.js';
import { updateMerchantBalance, addToPendingBalance } from '../services/balanceService.js';
import { PSPPaymentService } from '../services/pspPaymentService.js';
import { EncryptionService } from '../services/encryptionService.js';
import { notificationService } from '../services/notificationService.js';
import { commissionService } from '../services/commissionService.js';
import { webhookService } from '../services/webhookService.js';

// Lazy initialization to avoid loading env vars before they're set
let pspPaymentService: PSPPaymentService | null = null;

const getPSPPaymentService = (): PSPPaymentService => {
  if (!pspPaymentService) {
    const encryptionService = new EncryptionService();
    pspPaymentService = new PSPPaymentService(encryptionService, notificationService);
  }
  return pspPaymentService;
};

// Validation schema with conditional customer info based on payment method
const createPaymentRequestSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  description: z.string().min(1, 'Description is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  dueDate: z.string().min(1, 'Due date is required').transform((val) => {
    // If it's already a datetime string, return as is
    if (val.includes('T')) return val;
    // If it's a date string (YYYY-MM-DD), convert to datetime
    return new Date(val).toISOString();
  }),
  customerReference: z.string().optional(),
  customerInfo: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    billingCountry: z.string().min(1, 'Customer billing country is required'),
  }),
  paymentMethods: z.array(z.enum([PaymentMethod.BANK_WIRE, PaymentMethod.CARD])).min(1, 'At least one payment method is required'),
}).superRefine((data, ctx) => {
  // For bank wire transfers, require all customer info fields
  if (data.paymentMethods.includes(PaymentMethod.BANK_WIRE)) {
    if (!data.customerInfo.name || data.customerInfo.name.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Customer name is required for bank wire transfers',
        path: ['customerInfo', 'name'],
      });
    }
    if (!data.customerInfo.email || data.customerInfo.email.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Customer email is required for bank wire transfers',
        path: ['customerInfo', 'email'],
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerInfo.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Valid customer email is required for bank wire transfers',
        path: ['customerInfo', 'email'],
      });
    }
    if (!data.customerInfo.phone || data.customerInfo.phone.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Customer phone is required for bank wire transfers',
        path: ['customerInfo', 'phone'],
      });
    }
  }
  // For card payments, validate email format if provided
  if (data.paymentMethods.includes(PaymentMethod.CARD) && data.customerInfo.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerInfo.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Valid customer email is required',
        path: ['customerInfo', 'email'],
      });
    }
  }
});

export const createPaymentRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.MERCHANT) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const validatedData = createPaymentRequestSchema.parse(req.body);

    // Pre-validate availability of banks/cards for requested payment methods
    const unavailableMethods: string[] = [];

    // Check bank availability if bank wire is requested
    if (validatedData.paymentMethods.includes(PaymentMethod.BANK_WIRE)) {
      const customerGeo = validatedData.customerInfo?.billingCountry;
      if (!customerGeo) {
        res.status(400).json({ 
          success: false, 
          error: 'Customer billing country is required for bank wire transfers' 
        });
        return;
      }

      const availableBanks = await BankAccount.find({ 
        supportedGeos: customerGeo, 
        isActive: true,
        minTransactionLimit: { $lte: validatedData.amount },
        maxTransactionLimit: { $gte: validatedData.amount }
      });

      if (availableBanks.length === 0) {
        // Check if the issue is geo-related or amount-related
        const banksForGeo = await BankAccount.find({ 
          supportedGeos: customerGeo, 
          isActive: true 
        });
        
        if (banksForGeo.length === 0) {
          unavailableMethods.push(`Bank Wire (no active bank accounts available for ${customerGeo})`);
        } else {
          unavailableMethods.push(`Bank Wire (amount $${validatedData.amount} is outside the transaction limits of available banks for ${customerGeo})`);
        }
      }
    }

    // Card payments no longer require pre-configured cards - PSP links are generated dynamically
    // Only validate bank availability if bank wire is requested
    
    // Validate card payment limit ($250 maximum)
    if (validatedData.paymentMethods.includes(PaymentMethod.CARD)) {
      const CARD_PAYMENT_LIMIT = 250;
      if (validatedData.amount > CARD_PAYMENT_LIMIT) {
        res.status(400).json({ 
          success: false, 
          error: `Card payments are limited to a maximum of $${CARD_PAYMENT_LIMIT} USD. For higher amounts, please use Bank Wire Transfer.`
        });
        return;
      }
    }

    // If any payment methods don't have available processors, return error
    if (unavailableMethods.length > 0) {
      res.status(400).json({ 
        success: false, 
        error: `No suitable payment processors available. The following methods cannot be used: ${unavailableMethods.join(', ')}. Please contact support or try different payment methods.`
      });
      return;
    }

    // Auto-assign bank or card based on payment method
    let reason;
    let bankDetails;
    let bankAccountId;
    let cardId;
    let commissionPercent = 0;

    // Handle Bank Wire auto-assignment
    if (validatedData.paymentMethods.includes(PaymentMethod.BANK_WIRE)) {
      reason = generateReason();

      // Get customer's billing country (GEO)
      const customerGeo = validatedData.customerInfo?.billingCountry!;

      // Find active banks matching the customer's GEO and amount limits (already validated above)
      const availableBanks = await BankAccount.find({ 
        supportedGeos: customerGeo, 
        isActive: true,
        minTransactionLimit: { $lte: validatedData.amount },
        maxTransactionLimit: { $gte: validatedData.amount }
      });

      // Randomly select a bank
      const selectedBank = availableBanks[Math.floor(Math.random() * availableBanks.length)];
      bankAccountId = selectedBank._id;
      commissionPercent = selectedBank.commissionPercent;

      // Populate bank details
      bankDetails = {
        rails: [BankRail.SWIFT], // Default to SWIFT, can be customized
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
    
    if (validatedData.paymentMethods.includes(PaymentMethod.CARD)) {
      // Use commission service for card payment calculation
      commissionResult = commissionService.calculate(validatedData.amount, PaymentMethod.CARD);
      commissionPercent = commissionResult.commissionPercent;
      
      // Use PSP service to generate payment link
      const service = getPSPPaymentService();
      const pspLinkData = service.generatePaymentLink();
      pspPaymentToken = pspLinkData.token;
      pspPaymentLink = pspLinkData.link;
      
      // Set initial status to pending_submission for card payments
      initialStatus = PaymentRequestStatus.PENDING_SUBMISSION;
      
      // Optional: Try to find a card reference for backward compatibility
      cardId = await service.findCardReference();
    } else {
      // For bank wire, calculate commission based on selected bank
      commissionResult = commissionService.calculate(
        validatedData.amount, 
        PaymentMethod.BANK_WIRE, 
        commissionPercent
      );
    }

    // Use calculated commission values
    const commissionAmount = commissionResult.commissionAmount;
    const netAmount = commissionResult.netAmount;

    // Create payment request
    const paymentRequest = await PaymentRequest.create({
      userId: req.user.id,
      amount: validatedData.amount,
      currency: validatedData.currency,
      description: validatedData.description,
      invoiceNumber: validatedData.invoiceNumber,
      dueDate: validatedData.dueDate,
      customerReference: validatedData.customerReference,
      customerInfo: validatedData.customerInfo,
      paymentMethods: validatedData.paymentMethods,
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
    });

    // Add net amount (after commission) to pending balance when payment request is created
    // Default status is SENT which is a pending state
    await addToPendingBalance(req.user.id, netAmount, validatedData.currency);

    // Notify admin of new payment request via WebSocket
    await notificationService.notifyPaymentRequestCreated({
      paymentRequestId: (paymentRequest._id as any).toString(),
      merchantId: req.user.id,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      paymentMethods: paymentRequest.paymentMethods,
      status: paymentRequest.status,
      createdAt: paymentRequest.createdAt,
    });

    res.status(201).json({ success: true, data: paymentRequest });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    console.error('Create payment request error:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment request' });
  }
};

export const listPaymentRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { 
      status, 
      method, 
      startDate, 
      endDate,
      minAmount,
      maxAmount,
      page = 1, 
      limit = 10 
    } = req.query;

    let query: any = {};

    // For merchants, only show their own payment requests
    if (req.user.role === UserRole.MERCHANT) {
      query.userId = req.user.id;
    } else if (req.query.merchantId) {
      // For ops/admin, allow filtering by merchantId (userId)
      query.userId = req.query.merchantId;
    }

    // Apply filters
    if (status) query.status = status;
    if (method) query.paymentMethods = method;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }

    const paymentRequests = await PaymentRequest.find(query)
      .populate('userId', 'legalName supportEmail email')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await PaymentRequest.countDocuments(query);

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
    console.error('List payment requests error:', error);
    res.status(500).json({ success: false, error: 'Failed to list payment requests' });
  }
};

export const getPaymentRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const paymentRequest = await PaymentRequest.findById(id).populate('userId', 'legalName supportEmail email');
    
    if (!paymentRequest) {
      res.status(404).json({ success: false, error: 'Payment request not found' });
      return;
    }

    // Check authorization
    if (req.user) {
      if (req.user.role === UserRole.MERCHANT) {
        if (paymentRequest.userId._id.toString() !== req.user.id) {
          res.status(403).json({ success: false, error: 'Forbidden' });
          return;
        }
      }
    }

    // Mark as viewed if first time (public access)
    if (!paymentRequest.viewedAt) {
      paymentRequest.viewedAt = new Date();
      await paymentRequest.save();
    }

    res.json({ success: true, data: paymentRequest });
  } catch (error) {
    console.error('Get payment request error:', error);
    res.status(500).json({ success: false, error: 'Failed to get payment request' });
  }
};

export const updatePaymentRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    const paymentRequest = await PaymentRequest.findById(id);
    if (!paymentRequest) {
      res.status(404).json({ success: false, error: 'Payment request not found' });
      return;
    }

    // Check authorization
    const isMerchant = req.user.role === UserRole.MERCHANT;
    const isAdmin = [UserRole.ADMIN, UserRole.OPS, UserRole.FINANCE].includes(req.user.role);

    if (isMerchant) {
      // Merchants can only update their own payment requests
      if (paymentRequest.userId.toString() !== req.user.id) {
        res.status(403).json({ success: false, error: 'Forbidden' });
        return;
      }
      // Merchants can update limited fields
      const allowedFields = ['description', 'dueDate'];
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          (paymentRequest as any)[field] = updates[field];
        }
      });
    } else if (isAdmin) {
      // Admins can update status for any payment request
      const oldStatus = paymentRequest.status;
      
      const allowedFields = ['status', 'description', 'dueDate'];
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          (paymentRequest as any)[field] = updates[field];
        }
      });

      // Set paidAt timestamp when marking as paid
      if (updates.status === 'paid' && paymentRequest.status !== 'paid') {
        paymentRequest.paidAt = new Date();
      }

      // Update merchant balance if status changed
      if (updates.status !== undefined && updates.status !== oldStatus) {
        await updateMerchantBalance(
          paymentRequest.userId.toString(),
          paymentRequest.amount,
          oldStatus,
          updates.status as PaymentRequestStatus,
          paymentRequest.netAmount
        );
        
        // Trigger webhook notification on status change (async, don't wait)
        webhookService.notifyPaymentStatusChange(paymentRequest).catch(err => {
          console.error('Webhook notification error:', err);
        });
      }
    } else {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    await paymentRequest.save();

    res.json({ success: true, data: paymentRequest });
  } catch (error) {
    console.error('Update payment request error:', error);
    res.status(500).json({ success: false, error: 'Failed to update payment request' });
  }
};

export const cancelPaymentRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.MERCHANT) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    const paymentRequest = await PaymentRequest.findById(id);
    if (!paymentRequest) {
      res.status(404).json({ success: false, error: 'Payment request not found' });
      return;
    }

    // Check ownership
    if (paymentRequest.userId.toString() !== req.user.id) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const oldStatus = paymentRequest.status;
    paymentRequest.status = PaymentRequestStatus.CANCELLED;
    await paymentRequest.save();

    // Update balance when cancelling
    await updateMerchantBalance(
      paymentRequest.userId.toString(),
      paymentRequest.amount,
      oldStatus,
      PaymentRequestStatus.CANCELLED,
      paymentRequest.netAmount
    );
    
    // Trigger webhook notification for cancellation (async, don't wait)
    webhookService.notifyPaymentStatusChange(paymentRequest).catch(err => {
      console.error('Webhook notification error:', err);
    });

    res.json({ success: true, message: 'Payment request cancelled', data: paymentRequest });
  } catch (error) {
    console.error('Cancel payment request error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel payment request' });
  }
};

/**
 * Get webhook logs for a payment request
 */
export const getWebhookLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.MERCHANT) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    const paymentRequest = await PaymentRequest.findById(id);
    if (!paymentRequest) {
      res.status(404).json({ success: false, error: 'Payment request not found' });
      return;
    }

    // Check ownership
    if (paymentRequest.userId.toString() !== req.user.id) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    // Get webhook logs
    const logs = await webhookService.getWebhookLogs(id);
    const stats = await webhookService.getWebhookStats(id);

    res.json({ 
      success: true, 
      data: {
        logs,
        stats
      }
    });
  } catch (error) {
    console.error('Get webhook logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to get webhook logs' });
  }
};

