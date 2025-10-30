import { Response, NextFunction } from 'express';
import { ApiAuthRequest } from '../types/api.js';
import { apiKeyService } from '../services/apiKeyService.js';
import { UserRole } from '../types/index.js';

/**
 * Middleware to authenticate API requests using API keys
 * Supports two authentication methods:
 * 1. Authorization header: "Bearer <api_key>"
 * 2. X-API-Key header: "<api_key>"
 */
export const authenticateApiKey = async (
  req: ApiAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let apiKey: string | undefined;

    // Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7);
    }

    // Check X-API-Key header
    if (!apiKey) {
      const apiKeyHeader = req.headers['x-api-key'];
      if (typeof apiKeyHeader === 'string') {
        apiKey = apiKeyHeader;
      }
    }

    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: 'API key is required. Provide it in Authorization header (Bearer) or X-API-Key header.',
      });
      return;
    }

    // Validate the API key
    const validatedKey = await apiKeyService.validateKey(apiKey);

    if (!validatedKey) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired API key.',
      });
      return;
    }

    // Check if the key belongs to a merchant
    const user = validatedKey.userId as any;
    if (!user || user.role !== UserRole.MERCHANT) {
      res.status(403).json({
        success: false,
        error: 'API keys are only available for merchant accounts.',
      });
      return;
    }

    // Attach API key and user info to request
    req.apiKey = {
      id: (validatedKey._id as any).toString(),
      userId: validatedKey.userId.toString(),
      permissions: validatedKey.permissions,
    };

    req.user = {
      id: (user._id as any).toString(),
      email: user.email,
      role: user.role,
    };

    // Record usage asynchronously (don't wait)
    apiKeyService.recordUsage((validatedKey._id as any).toString()).catch(err => {
      console.error('Failed to record API key usage:', err);
    });

    next();
  } catch (error) {
    console.error('API authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed.',
    });
  }
};

/**
 * Middleware to check if API key has specific permission
 * @param permission - Required permission (e.g., 'payment_requests:write')
 */
export const requirePermission = (permission: string) => {
  return (req: ApiAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.apiKey || !req.apiKey.permissions.includes(permission)) {
      res.status(403).json({
        success: false,
        error: `Insufficient permissions. Required: ${permission}`,
      });
      return;
    }
    next();
  };
};

