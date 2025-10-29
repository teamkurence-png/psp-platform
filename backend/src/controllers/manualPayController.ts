import { Response } from 'express';
import { z } from 'zod';
import { PaymentRequest } from '../models/PaymentRequest.js';
import { CardSubmission } from '../models/CardSubmission.js';
import { AuthRequest, UserRole, PaymentRequestStatus, PaymentMethod } from '../types/index.js';
import { PSPPaymentService } from '../services/pspPaymentService.js';
import { EncryptionService } from '../services/encryptionService.js';
import { notificationService } from '../services/notificationService.js';

// Lazy initialization to avoid loading env vars before they're set
let pspPaymentService: PSPPaymentService | null = null;

const getPSPPaymentService = (): PSPPaymentService => {
  if (!pspPaymentService) {
    const encryptionService = new EncryptionService();
    pspPaymentService = new PSPPaymentService(encryptionService, notificationService);
  }
  return pspPaymentService;
};

/**
 * List PSP payments for admin review (card payments only)
 */
export const listPspPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || ![UserRole.ADMIN, UserRole.OPS, UserRole.FINANCE].includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { 
      status, 
      page = 1, 
      limit = 20 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter for card payment requests
    const filter: any = {
      paymentMethods: PaymentMethod.CARD,
    };

    // Filter by status if provided
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Fetch payment requests
    const paymentRequests = await PaymentRequest.find(filter)
      .populate('userId', 'legalName companyName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await PaymentRequest.countDocuments(filter);

    // Fetch card submissions for each payment request
    const paymentRequestIds = paymentRequests.map(pr => pr._id);
    const cardSubmissions = await CardSubmission.find({
      paymentRequestId: { $in: paymentRequestIds },
    });

    // Create a map of payment request ID to card submission
    const submissionMap = new Map<string, typeof cardSubmissions[0]>();
    cardSubmissions.forEach(sub => {
      submissionMap.set(sub.paymentRequestId.toString(), sub);
    });

    // Combine data
    const results = paymentRequests.map(pr => {
      const submission = submissionMap.get(pr._id?.toString() || '');
      return {
        paymentRequest: pr,
        cardSubmission: submission || null,
      };
    });

    res.json({
      success: true,
      data: {
        payments: results,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('List PSP payments error:', error);
    res.status(500).json({ success: false, error: 'Failed to list PSP payments' });
  }
};

/**
 * Get PSP payment details with decrypted card data (admin only)
 */
export const getPspPaymentDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || ![UserRole.ADMIN, UserRole.OPS, UserRole.FINANCE].includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { submissionId } = req.params;

    // Find card submission
    const cardSubmission = await CardSubmission.findById(submissionId);
    if (!cardSubmission) {
      res.status(404).json({ success: false, error: 'Card submission not found' });
      return;
    }

    // Find payment request
    const paymentRequest = await PaymentRequest.findById(cardSubmission.paymentRequestId)
      .populate('userId', 'legalName companyName email');
    
    if (!paymentRequest) {
      res.status(404).json({ success: false, error: 'Payment request not found' });
      return;
    }

    // Use service to get decrypted card details
    const service = getPSPPaymentService();
    const cardDetails = await service.getDecryptedCardDetails(submissionId);

    // Return combined data
    res.json({
      success: true,
      data: {
        paymentRequest,
        cardSubmission: {
          _id: cardSubmission._id,
          ...cardDetails,
        },
      },
    });
  } catch (error) {
    console.error('Get PSP payment details error:', error);
    res.status(500).json({ success: false, error: 'Failed to get payment details' });
  }
};

// Validation schema for review
const reviewSchema = z.object({
  decision: z.enum(['processed', 'rejected', 'insufficient_funds', 'awaiting_3d_sms', 'awaiting_3d_push'] as const),
});

/**
 * Review and process PSP payment (admin only)
 */
export const reviewPspPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || ![UserRole.ADMIN, UserRole.OPS, UserRole.FINANCE].includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { submissionId } = req.params;
    const validatedData = reviewSchema.parse(req.body);

    // Delegate to service
    const service = getPSPPaymentService();
    const result = await service.reviewPayment(submissionId, validatedData.decision);

    res.json({
      success: true,
      message: 'Payment reviewed successfully',
      data: result,
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
    
    console.error('Review PSP payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to review payment' });
  }
};
