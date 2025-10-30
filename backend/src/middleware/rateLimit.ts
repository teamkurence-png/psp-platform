import { Response, NextFunction } from 'express';
import { ApiAuthRequest } from '../types/api.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory rate limiter for API endpoints
 * Uses sliding window approach
 * For production, consider using Redis for distributed rate limiting
 */
class RateLimiter {
  private store: Map<string, RateLimitEntry>;
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.store = new Map();
    this.windowMs = windowMs; // Default: 1 minute
    this.maxRequests = maxRequests; // Default: 100 requests per window
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if a request should be rate limited
   * @param key - Unique identifier (e.g., API key ID or IP)
   * @returns Object with allowed status and remaining requests
   */
  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt < now) {
      // Create new entry or reset expired entry
      const resetAt = now + this.windowMs;
      this.store.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt,
      };
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    // Increment count
    entry.count++;
    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Clean up expired entries from the store
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Reset rate limit for a specific key (useful for testing)
   * @param key - Unique identifier
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Get current stats for a key
   * @param key - Unique identifier
   */
  getStats(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }
}

// Create rate limiter instances
const apiRateLimiter = new RateLimiter(60000, 100); // 100 requests per minute
const strictRateLimiter = new RateLimiter(60000, 10); // 10 requests per minute (for sensitive operations)

/**
 * Middleware to apply rate limiting to API requests
 * @param limiter - Optional custom rate limiter instance
 */
export const apiRateLimit = (limiter: RateLimiter = apiRateLimiter) => {
  return (req: ApiAuthRequest, res: Response, next: NextFunction): void => {
    // Use API key ID as identifier, fallback to IP if not authenticated
    const identifier = req.apiKey?.id || req.ip || 'unknown';

    const result = limiter.check(identifier);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limiter['maxRequests']);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      res.setHeader('Retry-After', retryAfter);
      
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter,
      });
      return;
    }

    next();
  };
};

/**
 * Strict rate limiter for sensitive operations (e.g., API key creation)
 */
export const strictRateLimit = apiRateLimit(strictRateLimiter);

// Export rate limiter instances for testing/monitoring
export { apiRateLimiter, strictRateLimiter, RateLimiter };

