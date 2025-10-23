import { Response } from 'express';
import { z } from 'zod';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { User } from '../models/User.js';
import { Merchant } from '../models/Merchant.js';
import { Balance } from '../models/Balance.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { AuthRequest, UserRole } from '../types/index.js';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum([UserRole.MERCHANT, UserRole.OPS, UserRole.FINANCE, UserRole.ADMIN]).optional(),
  legalName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  twoFactorToken: z.string().optional(),
});

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { email, password, role = UserRole.MERCHANT, legalName } = validatedData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, error: 'User already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      role,
    });

    // If merchant, create merchant profile and balance
    if (role === UserRole.MERCHANT) {
      const merchant = await Merchant.create({
        userId: user._id,
        legalName: legalName || email,
      });

      await Balance.create({
        merchantId: merchant._id,
        available: 0,
        pending: 0,
        reserve: 0,
        currency: 'USD',
      });
    }

    // Generate tokens
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password, twoFactorToken } = validatedData;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        res.status(200).json({ 
          success: true, 
          requires2FA: true,
          message: '2FA token required',
        });
        return;
      }

      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: twoFactorToken,
        window: 2,
      });

      if (!isValid) {
        res.status(401).json({ success: false, error: 'Invalid 2FA token' });
        return;
      }
    }

    // Get merchant ID if user is a merchant
    let merchantId: string | undefined;
    if (user.role === UserRole.MERCHANT) {
      const merchant = await Merchant.findOne({ userId: user._id });
      merchantId = merchant?._id.toString();
    }

    // Generate tokens
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      merchantId,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token and update last login
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled,
          merchantId,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
};

export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token required' });
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      res.status(401).json({ success: false, error: 'Invalid refresh token' });
      return;
    }

    // Find user and verify refresh token
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({ success: false, error: 'Invalid refresh token' });
      return;
    }

    // Get merchant ID if user is a merchant
    let merchantId: string | undefined;
    if (user.role === UserRole.MERCHANT) {
      const merchant = await Merchant.findOne({ userId: user._id });
      merchantId = merchant?._id.toString();
    }

    // Generate new tokens
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      merchantId,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ success: false, error: 'Token refresh failed' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Clear refresh token
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
};

export const setup2FA = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `PSP Platform (${user.email})`,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    // Save secret (but don't enable yet)
    user.twoFactorSecret = secret.base32;
    await user.save();

    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode,
      },
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ success: false, error: '2FA setup failed' });
  }
};

export const verify2FA = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, error: 'Token required' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.twoFactorSecret) {
      res.status(400).json({ success: false, error: '2FA not set up' });
      return;
    }

    // Verify token
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValid) {
      res.status(400).json({ success: false, error: 'Invalid token' });
      return;
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    await user.save();

    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ success: false, error: '2FA verification failed' });
  }
};

export const disable2FA = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, error: 'Token required' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.twoFactorEnabled) {
      res.status(400).json({ success: false, error: '2FA not enabled' });
      return;
    }

    // Verify token before disabling
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret!,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValid) {
      res.status(400).json({ success: false, error: 'Invalid token' });
      return;
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    res.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ success: false, error: 'Failed to disable 2FA' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user.id).select('-password -refreshToken');
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    let merchantData = null;
    if (user.role === UserRole.MERCHANT) {
      merchantData = await Merchant.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled,
          lastLogin: user.lastLogin,
        },
        merchant: merchantData,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user data' });
  }
};

// Admin: Get all users
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find({}, '-password -refreshToken -twoFactorSecret')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to get users' });
  }
};

// Admin: Update user role
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({ success: false, error: 'Invalid role' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user role' });
  }
};

// Admin: Deactivate user
export const deactivateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ success: false, error: 'Failed to deactivate user' });
  }
};

// Admin: Activate user
export const activateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    user.isActive = true;
    await user.save();

    res.json({
      success: true,
      message: 'User activated successfully',
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ success: false, error: 'Failed to activate user' });
  }
};

