import Redis from 'ioredis';
import { env } from '../config/env.js';

let redis: Redis | null = null;

if (env.REDIS_URL) {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    console.error('Redis connection error:', err.message);
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redis.connect().catch(() => {
    console.warn('⚠️ Redis not available — rate limiting disabled');
  });
} else {
  console.warn('⚠️ REDIS_URL not set — rate limiting disabled');
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: string;
}

/**
 * Check rate limit for an agent's owner calls.
 * Free unverified: 10/day, verified: 30/day, premium: 200/day
 * For MVP, all are free tier (10/day). Verification/premium tiers come in S03.
 */
export async function checkRateLimit(
  agentId: number,
  dailyLimit: number = 10
): Promise<RateLimitResult> {
  // If Redis is not connected, allow (fail open)
  if (!redis || redis.status !== 'ready') {
    return { allowed: true, limit: dailyLimit, remaining: dailyLimit, resetAt: '' };
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const key = `ratelimit:agent:${agentId}:${today}`;

  try {
    const current = await redis.incr(key);

    // Set TTL on first call of the day (expire at midnight UTC)
    if (current === 1) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      const ttl = Math.ceil((tomorrow.getTime() - now.getTime()) / 1000);
      await redis.expire(key, ttl);
    }

    const allowed = current <= dailyLimit;
    const remaining = Math.max(0, dailyLimit - current);

    // Calculate reset time (next midnight UTC)
    const now = new Date();
    const resetDate = new Date(now);
    resetDate.setUTCDate(resetDate.getUTCDate() + 1);
    resetDate.setUTCHours(0, 0, 0, 0);

    return {
      allowed,
      limit: dailyLimit,
      remaining,
      resetAt: resetDate.toISOString(),
    };
  } catch (err) {
    console.error('Rate limit check failed:', err);
    // Fail open
    return { allowed: true, limit: dailyLimit, remaining: dailyLimit, resetAt: '' };
  }
}
