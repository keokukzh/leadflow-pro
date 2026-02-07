import { NextRequest } from 'next/server';
import { LRUCache } from 'lru-cache';

interface RateLimitConfig {
  interval: number; // in milliseconds
  uniqueTokenPerInterval: number;
}

/**
 * Rate limiting utility for API routes
 * Uses LRU cache to track request counts per IP
 */
export function rateLimit(options: RateLimitConfig) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: async (limit: number, token: string, _req?: NextRequest) => {
      const tokenCount = tokenCache.get(token) || [0];
      if (tokenCount[0] === 0) {
        tokenCache.set(token, [1]);
      }
      tokenCount[0] += 1;

      const currentUsage = tokenCount[0];
      const isRateLimited = currentUsage >= limit;

      return {
        success: !isRateLimited,
        limit,
        remaining: isRateLimited ? 0 : limit - currentUsage,
      };
    },
  };
}

// Global instance for the API
export const apiRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});
