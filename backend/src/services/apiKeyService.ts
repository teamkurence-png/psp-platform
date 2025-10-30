import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { ApiKey, IApiKey } from '../models/ApiKey.js';
import { ApiKeyInfo, ApiKeyWithToken } from '../types/api.js';

export class ApiKeyService {
  private readonly SALT_ROUNDS = 10;
  private readonly KEY_LENGTH = 32; // 32 bytes = 64 hex chars

  /**
   * Generate a secure API key with the specified environment prefix
   * @param environment - 'live' or 'test'
   * @returns Object with full key and prefix
   */
  generateKey(environment: 'live' | 'test' = 'live'): { fullKey: string; prefix: string } {
    const randomBytes = crypto.randomBytes(this.KEY_LENGTH);
    const randomString = randomBytes.toString('hex');
    const prefix = `psp_${environment}_`;
    const fullKey = `${prefix}${randomString}`;
    
    return {
      fullKey,
      prefix: fullKey.substring(0, 12), // e.g., "psp_live_abc"
    };
  }

  /**
   * Hash the API key using bcrypt
   * @param key - The plain API key
   * @returns Hashed key
   */
  async hashKey(key: string): Promise<string> {
    return bcrypt.hash(key, this.SALT_ROUNDS);
  }

  /**
   * Validate an API key and return associated user information
   * Uses constant-time comparison to prevent timing attacks
   * @param providedKey - The API key from the request
   * @returns ApiKey document if valid, null otherwise
   */
  async validateKey(providedKey: string): Promise<IApiKey | null> {
    try {
      // Extract prefix from provided key to narrow down search
      const prefix = providedKey.substring(0, 12);
      
      // Find all active keys with matching prefix
      const apiKeys = await ApiKey.find({ 
        prefix, 
        isActive: true,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      }).populate('userId', 'email role legalName isActive');

      // Check each key using constant-time comparison
      for (const apiKey of apiKeys) {
        const isValid = await bcrypt.compare(providedKey, apiKey.key);
        if (isValid) {
          // Check if user is still active
          const user = apiKey.userId as any;
          if (user && user.isActive) {
            return apiKey;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('API key validation error:', error);
      return null;
    }
  }

  /**
   * Create a new API key for a user
   * @param userId - The merchant user ID
   * @param name - User-friendly name for the key
   * @param expiresAt - Optional expiration date
   * @returns API key info with full key (only returned once)
   */
  async createKey(
    userId: string,
    name: string,
    expiresAt?: Date
  ): Promise<ApiKeyWithToken> {
    const { fullKey, prefix } = this.generateKey('live');
    const hashedKey = await this.hashKey(fullKey);

    const apiKey = await ApiKey.create({
      userId,
      key: hashedKey,
      prefix,
      name,
      expiresAt,
      isActive: true,
    });

    return {
      id: (apiKey._id as any).toString(),
      userId: apiKey.userId.toString(),
      prefix: apiKey.prefix,
      name: apiKey.name,
      isActive: apiKey.isActive,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      permissions: apiKey.permissions,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
      fullKey, // Only returned during creation
    };
  }

  /**
   * List all API keys for a user (without exposing full keys)
   * @param userId - The merchant user ID
   * @returns Array of API key metadata
   */
  async listKeys(userId: string): Promise<ApiKeyInfo[]> {
    const apiKeys = await ApiKey.find({ userId }).sort({ createdAt: -1 });

    return apiKeys.map(key => ({
      id: (key._id as any).toString(),
      userId: key.userId.toString(),
      prefix: key.prefix,
      name: key.name,
      isActive: key.isActive,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      permissions: key.permissions,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
    }));
  }

  /**
   * Get details of a specific API key
   * @param keyId - The API key ID
   * @param userId - The merchant user ID (for authorization)
   * @returns API key info or null
   */
  async getKey(keyId: string, userId: string): Promise<ApiKeyInfo | null> {
    const apiKey = await ApiKey.findOne({ _id: keyId, userId });
    
    if (!apiKey) {
      return null;
    }

    return {
      id: (apiKey._id as any).toString(),
      userId: apiKey.userId.toString(),
      prefix: apiKey.prefix,
      name: apiKey.name,
      isActive: apiKey.isActive,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      permissions: apiKey.permissions,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
    };
  }

  /**
   * Revoke (deactivate) an API key
   * @param keyId - The API key ID
   * @param userId - The merchant user ID (for authorization)
   * @returns true if revoked, false otherwise
   */
  async revokeKey(keyId: string, userId: string): Promise<boolean> {
    const result = await ApiKey.updateOne(
      { _id: keyId, userId },
      { $set: { isActive: false } }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Record the usage of an API key (update lastUsedAt timestamp)
   * @param keyId - The API key ID
   */
  async recordUsage(keyId: string): Promise<void> {
    await ApiKey.updateOne(
      { _id: keyId },
      { $set: { lastUsedAt: new Date() } }
    );
  }

  /**
   * Delete an API key permanently (use with caution)
   * @param keyId - The API key ID
   * @param userId - The merchant user ID (for authorization)
   * @returns true if deleted, false otherwise
   */
  async deleteKey(keyId: string, userId: string): Promise<boolean> {
    const result = await ApiKey.deleteOne({ _id: keyId, userId });
    return result.deletedCount > 0;
  }
}

// Export singleton instance
export const apiKeyService = new ApiKeyService();

