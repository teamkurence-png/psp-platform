import { Response } from 'express';
import { z } from 'zod';
import { Merchant } from '../models/Merchant.js';
import { DocumentModel } from '../models/Document.js';
import { AuthRequest, UserRole, OnboardingStatus } from '../types/index.js';

// Validation schema
const updateProfileSchema = z.object({
  legalName: z.string().optional(),
  dba: z.string().optional(),
  registrationNumber: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }).optional(),
  phone: z.string().optional(),
  supportEmail: z.string().email().optional(),
  telegram: z.string().optional(),
});

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    let merchant;
    if (req.user.role === UserRole.MERCHANT) {
      merchant = await Merchant.findOne({ userId: req.user.id });
    } else {
      // For ops/admin viewing merchant profile
      const { merchantId } = req.params;
      merchant = await Merchant.findById(merchantId);
    }

    if (!merchant) {
      res.status(404).json({ success: false, error: 'Merchant not found' });
      return;
    }

    res.json({ success: true, data: merchant });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.MERCHANT) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const validatedData = updateProfileSchema.parse(req.body);

    const merchant = await Merchant.findOne({ userId: req.user.id });
    if (!merchant) {
      res.status(404).json({ success: false, error: 'Merchant not found' });
      return;
    }

    // Update merchant profile
    Object.assign(merchant, validatedData);
    await merchant.save();

    res.json({ success: true, data: merchant });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};

export const submitForReview = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Check if required fields are filled
    if (!merchant.legalName || !merchant.address) {
      res.status(400).json({ 
        success: false, 
        error: 'Please complete all required fields before submitting' 
      });
      return;
    }

    // Check if documents are uploaded
    const documents = await DocumentModel.find({ merchantId: merchant._id });
    if (documents.length === 0) {
      res.status(400).json({ 
        success: false, 
        error: 'Please upload required documents before submitting' 
      });
      return;
    }

    // Update status
    merchant.onboardingStatus = OnboardingStatus.IN_REVIEW;
    await merchant.save();

    res.json({ 
      success: true, 
      message: 'Application submitted for review',
      data: merchant 
    });
  } catch (error) {
    console.error('Submit for review error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit application' });
  }
};

export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
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

    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const { type } = req.body;
    if (!type) {
      res.status(400).json({ success: false, error: 'Document type is required' });
      return;
    }

    const document = await DocumentModel.create({
      merchantId: merchant._id,
      type,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });

    res.json({ success: true, data: document });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload document' });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    let merchantId;
    if (req.user.role === UserRole.MERCHANT) {
      const merchant = await Merchant.findOne({ userId: req.user.id });
      merchantId = merchant?._id;
    } else {
      // For ops/admin viewing merchant documents
      merchantId = req.params.merchantId;
    }

    if (!merchantId) {
      res.status(404).json({ success: false, error: 'Merchant not found' });
      return;
    }

    const documents = await DocumentModel.find({ merchantId });

    res.json({ success: true, data: documents });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ success: false, error: 'Failed to get documents' });
  }
};

export const reviewOnboarding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || ![UserRole.OPS, UserRole.ADMIN].includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { merchantId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!status || ![OnboardingStatus.APPROVED, OnboardingStatus.REJECTED].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      res.status(404).json({ success: false, error: 'Merchant not found' });
      return;
    }

    merchant.onboardingStatus = status;
    if (status === OnboardingStatus.REJECTED) {
      merchant.rejectionReason = rejectionReason;
    } else {
      merchant.approvedAt = new Date();
    }
    await merchant.save();

    res.json({ 
      success: true, 
      message: `Merchant ${status.toLowerCase()}`,
      data: merchant 
    });
  } catch (error) {
    console.error('Review onboarding error:', error);
    res.status(500).json({ success: false, error: 'Failed to review application' });
  }
};

export const listMerchants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || ![UserRole.OPS, UserRole.FINANCE, UserRole.ADMIN].includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { status, page = 1, limit = 10 } = req.query;
    const query: any = {};

    if (status) {
      query.onboardingStatus = status;
    }

    const merchants = await Merchant.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Merchant.countDocuments(query);

    res.json({
      success: true,
      data: {
        merchants,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('List merchants error:', error);
    res.status(500).json({ success: false, error: 'Failed to list merchants' });
  }
};

