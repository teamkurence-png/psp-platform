import { Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { AuthRequest, UserRole } from '../types/index.js';

/**
 * Middleware to check if authenticated user is a merchant leader
 * Must be used after authenticate middleware
 */
export const requireMerchantLeader = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Only merchants can be merchant leaders
    if (req.user.role !== UserRole.MERCHANT) {
      res.status(403).json({ 
        success: false, 
        error: 'Access denied. Merchant role required.' 
      });
      return;
    }

    // Check if user is a merchant leader
    const user = await User.findById(req.user.id).select('isMerchantLeader');
    
    if (!user || !user.isMerchantLeader) {
      res.status(403).json({ 
        success: false, 
        error: 'Access denied. Merchant leader status required.' 
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Merchant leader middleware error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

