import { Request, Response } from 'express';
import { z } from 'zod';
import { PaymentRequest } from '../models/PaymentRequest.js';
import { CardSubmission } from '../models/CardSubmission.js';
import { PaymentRequestStatus, PaymentMethod } from '../types/index.js';
import { PSPPaymentService } from '../services/pspPaymentService.js';
import { EncryptionService } from '../services/encryptionService.js';
import { notificationService } from '../services/notificationService.js';

// Initialize services
const encryptionService = new EncryptionService();
const pspPaymentService = new PSPPaymentService(encryptionService, notificationService);

// Validation schema for card submission
const cardSubmissionSchema = z.object({
  cardholderName: z.string().min(1, 'Cardholder name is required'),
  cardNumber: z.string().regex(/^\d{13,19}$/, 'Invalid card number'),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Invalid expiry date (MM/YY)'),
  cvc: z.string().regex(/^\d{3,4}$/, 'Invalid CVC'),
});

/**
 * Get payment form details by token (public endpoint)
 */
export const getPaymentFormByToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({ success: false, error: 'Token is required' });
      return;
    }

    // Find payment request by token
    const paymentRequest = await PaymentRequest.findOne({ 
      pspPaymentToken: token 
    }).populate('userId', 'legalName companyName email');

    if (!paymentRequest) {
      res.status(404).json({ success: false, error: 'Payment request not found' });
      return;
    }

    // Check if payment request includes card method
    if (!paymentRequest.paymentMethods.includes(PaymentMethod.CARD)) {
      res.status(400).json({ success: false, error: 'This payment request does not support card payments' });
      return;
    }

    // Check if already submitted
    const existingSubmission = await CardSubmission.findOne({
      paymentRequestId: paymentRequest._id,
    });

    const isAlreadySubmitted = existingSubmission !== null;

    // Return payment details for the form
    res.json({
      success: true,
      data: {
        paymentRequestId: paymentRequest._id,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        description: paymentRequest.description,
        invoiceNumber: paymentRequest.invoiceNumber,
        merchantName: (paymentRequest.userId as any)?.legalName || (paymentRequest.userId as any)?.companyName || 'Merchant',
        customerInfo: paymentRequest.customerInfo,
        status: paymentRequest.status,
        isAlreadySubmitted,
      },
    });
  } catch (error) {
    console.error('Get payment form error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve payment form' });
  }
};

/**
 * Submit card payment (public endpoint)
 */
export const submitCardPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    
    if (!token) {
      res.status(400).json({ success: false, error: 'Token is required' });
      return;
    }

    // Validate card data
    const validatedData = cardSubmissionSchema.parse(req.body);

    // Get IP address and user agent
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Delegate to service
    const result = await pspPaymentService.submitCardPayment(token, {
      ...validatedData,
      ipAddress,
      userAgent,
    });

    res.status(200).json({ 
      success: true, 
      message: 'Payment submitted successfully',
      data: {
        submissionId: result.submissionId,
        paymentRequestId: result.paymentRequestId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    
    // Handle service errors
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    
    console.error('Submit card payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit payment' });
  }
};

/**
 * Get payment status by token (public endpoint for polling)
 */
export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({ success: false, error: 'Token is required' });
      return;
    }

    // Find payment request by token
    const paymentRequest = await PaymentRequest.findOne({ 
      pspPaymentToken: token 
    });

    if (!paymentRequest) {
      res.status(404).json({ success: false, error: 'Payment request not found' });
      return;
    }

    // Find card submission if exists
    const cardSubmission = await CardSubmission.findOne({
      paymentRequestId: paymentRequest._id,
    });

    res.json({
      success: true,
      data: {
        paymentRequestId: paymentRequest._id,
        status: paymentRequest.status,
        submissionStatus: cardSubmission?.status || null,
        reviewedAt: cardSubmission?.reviewedAt || null,
      },
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve payment status' });
  }
};
