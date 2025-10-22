import { Response } from 'express';
import { z } from 'zod';
import { PaymentRequest } from '../models/PaymentRequest.js';
import { Merchant } from '../models/Merchant.js';
import { AuthRequest, UserRole, PaymentMethod, BankRail } from '../types/index.js';
import { generateReferenceCode, generateCheckoutUrl } from '../utils/generators.js';

// Validation schema
const createPaymentRequestSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  description: z.string().optional(),
  invoiceNumber: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  customerReference: z.string().optional(),
  customerInfo: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    billingCountry: z.string().optional(),
  }).optional(),
  paymentMethods: z.array(z.enum([PaymentMethod.BANK_WIRE, PaymentMethod.CARD])),
  bankDetails: z.object({
    rails: z.array(z.enum([BankRail.SEPA, BankRail.SWIFT, BankRail.LOCAL])),
    beneficiaryName: z.string().optional(),
    iban: z.string().optional(),
    accountNumber: z.string().optional(),
    routingNumber: z.string().optional(),
    swiftCode: z.string().optional(),
    bankName: z.string().optional(),
    bankAddress: z.string().optional(),
  }).optional(),
  cardSettings: z.object({
    allowedBrands: z.array(z.string()).optional(),
    require3DS: z.boolean().default(false),
    expiryDate: z.string().datetime().optional(),
  }).optional(),
});

export const createPaymentRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.MERCHANT) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const merchant = await Merchant.findOne({ userId: req.user.id });
    if (!merchant) {
      res.status(404).json({ success: false, error: 'Merchant not found' });
      return;
    }

    const validatedData = createPaymentRequestSchema.parse(req.body);

    // Generate reference code for bank wire
    let referenceCode;
    if (validatedData.paymentMethods.includes(PaymentMethod.BANK_WIRE)) {
      referenceCode = generateReferenceCode();
    }

    // Create payment request
    const paymentRequest = await PaymentRequest.create({
      merchantId: merchant._id,
      ...validatedData,
      referenceCode,
      checkoutUrl: '', // Will be set after creation
    });

    // Generate checkout URL
    if (validatedData.paymentMethods.includes(PaymentMethod.CARD)) {
      paymentRequest.checkoutUrl = generateCheckoutUrl(paymentRequest._id.toString());
      await paymentRequest.save();
    }

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
      const merchant = await Merchant.findOne({ userId: req.user.id });
      if (!merchant) {
        res.status(404).json({ success: false, error: 'Merchant not found' });
        return;
      }
      query.merchantId = merchant._id;
    } else if (req.query.merchantId) {
      // For ops/admin, allow filtering by merchantId
      query.merchantId = req.query.merchantId;
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
      .populate('merchantId', 'legalName supportEmail')
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

    const paymentRequest = await PaymentRequest.findById(id).populate('merchantId', 'legalName supportEmail');
    
    if (!paymentRequest) {
      res.status(404).json({ success: false, error: 'Payment request not found' });
      return;
    }

    // Check authorization
    if (req.user) {
      if (req.user.role === UserRole.MERCHANT) {
        const merchant = await Merchant.findOne({ userId: req.user.id });
        if (!merchant || paymentRequest.merchantId._id.toString() !== merchant._id.toString()) {
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
    if (!req.user || req.user.role !== UserRole.MERCHANT) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    const paymentRequest = await PaymentRequest.findById(id);
    if (!paymentRequest) {
      res.status(404).json({ success: false, error: 'Payment request not found' });
      return;
    }

    // Check ownership
    const merchant = await Merchant.findOne({ userId: req.user.id });
    if (!merchant || paymentRequest.merchantId.toString() !== merchant._id.toString()) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    // Update allowed fields
    const allowedFields = ['description', 'dueDate', 'status'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        (paymentRequest as any)[field] = updates[field];
      }
    });

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
    const merchant = await Merchant.findOne({ userId: req.user.id });
    if (!merchant || paymentRequest.merchantId.toString() !== merchant._id.toString()) {
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

