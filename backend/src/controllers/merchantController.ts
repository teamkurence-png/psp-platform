import { Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
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

    let user;
    if (req.user.role === UserRole.MERCHANT) {
      user = await User.findById(req.user.id).select('-password -refreshToken -twoFactorSecret');
    } else {
      // For ops/admin viewing merchant profile
      const { merchantId } = req.params;
      user = await User.findById(merchantId).select('-password -refreshToken -twoFactorSecret');
    }

    if (!user || user.role !== UserRole.MERCHANT) {
      res.status(404).json({ success: false, error: 'Merchant not found' });
      return;
    }

    res.json({ success: true, data: user });
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

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Update merchant profile
    Object.assign(user, validatedData);
    await user.save();

    // Return user without sensitive fields
    const userResponse: any = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;
    delete userResponse.twoFactorSecret;

    res.json({ success: true, data: userResponse });
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

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Check if required fields are filled
    if (!user.legalName || !user.address) {
      res.status(400).json({ 
        success: false, 
        error: 'Please complete all required fields before submitting' 
      });
      return;
    }

    // Update status
    user.onboardingStatus = OnboardingStatus.IN_REVIEW;
    await user.save();

    // Return user without sensitive fields
    const userResponse: any = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;
    delete userResponse.twoFactorSecret;

    res.json({ 
      success: true, 
      message: 'Application submitted for review',
      data: userResponse 
    });
  } catch (error) {
    console.error('Submit for review error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit application' });
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

    const user = await User.findById(merchantId);
    if (!user || user.role !== UserRole.MERCHANT) {
      res.status(404).json({ success: false, error: 'Merchant not found' });
      return;
    }

    user.onboardingStatus = status;
    if (status === OnboardingStatus.REJECTED) {
      user.rejectionReason = rejectionReason;
      user.isActive = false;
    } else {
      user.approvedAt = new Date();
      user.isActive = true;
    }
    await user.save();

    // Return user without sensitive fields
    const userResponse: any = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;
    delete userResponse.twoFactorSecret;

    res.json({ 
      success: true, 
      message: `Merchant ${status.toLowerCase()}`,
      data: userResponse 
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
    const query: any = { role: UserRole.MERCHANT };

    if (status) {
      query.onboardingStatus = status;
    }

    const merchants = await User.find(query)
      .select('-password -refreshToken -twoFactorSecret')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

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

