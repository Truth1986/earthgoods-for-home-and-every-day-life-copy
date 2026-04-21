import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyPrefix: string; // Prefix for storing rate limit keys
}

export class RateLimiter {
  private base44: any;
  private config: RateLimitConfig;
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(base44: any, config: RateLimitConfig) {
    this.base44 = base44;
    this.config = config;
  }

  async isAllowed(identifier: string): Promise<boolean> {
    const key = `${this.config.keyPrefix}:${identifier}`;
    const now = Date.now();

    // Try to get from cache first
    const cached = this.requests.get(identifier);
    if (cached && cached.resetTime > now) {
      if (cached.count < this.config.maxRequests) {
        cached.count++;
        return true;
      }
      return false;
    }

    // Reset if window has passed
    this.requests.set(identifier, {
      count: 1,
      resetTime: now + this.config.windowMs,
    });

    return true;
  }

  getRemainingRequests(identifier: string): number {
    const cached = this.requests.get(identifier);
    if (!cached) return this.config.maxRequests;
    
    if (cached.resetTime < Date.now()) {
      this.requests.delete(identifier);
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - cached.count);
  }

  getResetTime(identifier: string): number {
    const cached = this.requests.get(identifier);
    return cached?.resetTime || Date.now();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (value.resetTime < now) {
        this.requests.delete(key);
      }
    }
  }
}

// Pre-configured limiters
export const rateLimiters = {
  checkout: new Map<string, RateLimiter>(),
  checkoutSession: (base44: any) =>
    new RateLimiter(base44, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
      keyPrefix: 'checkout',
    }),

  api: (base44: any) =>
    new RateLimiter(base44, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      keyPrefix: 'api',
    }),

  webhook: (base44: any) =>
    new RateLimiter(base44, {
      windowMs: 10 * 1000, // 10 seconds
      maxRequests: 1000,
      keyPrefix: 'webhook',
    }),
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export const checkRateLimit = async (
  limiter: RateLimiter,
  identifier: string
): Promise<RateLimitResult> => {
  const allowed = await limiter.isAllowed(identifier);
  const remaining = limiter.getRemainingRequests(identifier);
  const resetTime = limiter.getResetTime(identifier);

  return {
    allowed,
    remaining,
    resetTime,
    retryAfter: allowed ? undefined : Math.ceil((resetTime - Date.now()) / 1000),
  };
};
