import { User } from '../models/User.js';
import { AuthRequest, UserRole } from '../types/index.js';

/**
 * Get the user ID for the authenticated merchant user
 * Since merchants are now users with role MERCHANT, this simply returns the user ID
 * @param req - The authenticated request
 * @returns The user ID or null if not found
 */
export const getMerchantId = async (req: AuthRequest): Promise<string | null> => {
  if (!req.user || req.user.role !== UserRole.MERCHANT) {
    return null;
  }

  return req.user.id;
};

/**
 * Get the user document for the authenticated merchant
 * @param req - The authenticated request
 * @returns The user document or null if not found
 */
export const getMerchant = async (req: AuthRequest) => {
  if (!req.user || req.user.role !== UserRole.MERCHANT) {
    return null;
  }

  return await User.findById(req.user.id);
};

