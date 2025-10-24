import { Response } from 'express';
import { z } from 'zod';
import { PaymentRequest } from '../models/PaymentRequest.js';
import { BankAccount } from '../models/BankAccount.js';
import { Card } from '../models/Card.js';
import { AuthRequest, UserRole, PaymentMethod, BankRail } from '../types/index.js';
import { generateReferenceCode } from '../utils/generators.js';

// Validation schema
const createPaymentRequestSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  description: z.string().optional(),
  invoiceNumber: z.string().optional(),
  dueDate: z.string().optional().transform((val) => {
    if (!val) return undefined;
    // If it's already a datetime string, return as is
    if (val.includes('T')) return val;
    // If it's a date string (YYYY-MM-DD), convert to datetime
    return new Date(val).toISOString();
  }),
  customerReference: z.string().optional(),
  customerInfo: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    billingCountry: z.string().optional(),
  }).optional(),
  paymentMethods: z.array(z.enum([PaymentMethod.BANK_WIRE, PaymentMethod.CARD])).min(1, 'At least one payment method is required'),
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
        geo: customerGeo, 
        isActive: true 
      });

      if (availableBanks.length === 0) {
        unavailableMethods.push(`Bank Wire (no active bank accounts available for ${customerGeo})`);
      }
    }

    // Check card availability if card is requested
    if (validatedData.paymentMethods.includes(PaymentMethod.CARD)) {
      const availableCards = await Card.find({ isActive: true });
      if (availableCards.length === 0) {
        unavailableMethods.push('Card Payment (no active payment cards available)');
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
    let referenceCode;
    let bankDetails;
    let bankAccountId;
    let cardId;

    // Handle Bank Wire auto-assignment
    if (validatedData.paymentMethods.includes(PaymentMethod.BANK_WIRE)) {
      referenceCode = generateReferenceCode();

      // Get customer's billing country (GEO)
      const customerGeo = validatedData.customerInfo?.billingCountry!;

      // Find active banks matching the customer's GEO (already validated above)
      const availableBanks = await BankAccount.find({ 
        geo: customerGeo, 
        isActive: true 
      });

      // Randomly select a bank
      const selectedBank = availableBanks[Math.floor(Math.random() * availableBanks.length)];
      bankAccountId = selectedBank._id;

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

    // Handle Card auto-assignment
    if (validatedData.paymentMethods.includes(PaymentMethod.CARD)) {
      // Find all active cards (already validated above)
      const availableCards = await Card.find({ isActive: true });

      // Randomly select a card
      const selectedCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      cardId = selectedCard._id;
    }

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
      bankAccountId,
      cardId,
      bankDetails,
      referenceCode,
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

    paymentRequest.status = 'cancelled' as any;
    await paymentRequest.save();

    res.json({ success: true, message: 'Payment request cancelled', data: paymentRequest });
  } catch (error) {
    console.error('Cancel payment request error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel payment request' });
  }
};

