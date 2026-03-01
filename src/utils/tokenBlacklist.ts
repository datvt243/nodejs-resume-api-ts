/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Token blacklist with Redis support or In-Memory fallback
 */

import jwt from 'jsonwebtoken';
import { isRedisAvailable, getRedisClient } from '@/services/redis';

type Entry = { expiresAt: number };

// In-Memory fallback (used when Redis unavailable)
const memoryStore = new Map<string, Entry>();

// cleanup expired entries periodically (in-memory only)
const _cleanup = setInterval(() => {
  const now = Date.now() / 1000;
  for (const [token, entry] of memoryStore) {
    if (entry.expiresAt <= now) memoryStore.delete(token);
  }
}, 60 * 1000);
// do not keep node process alive for tests
if (typeof (_cleanup as any).unref === 'function') (_cleanup as any).unref();

export const addToBlacklist = async (token: string): Promise<boolean> => {
  try {
    const decoded = jwt.decode(token) as any;
    const exp = decoded?.exp as number | undefined;
    const expiresAt = exp || Math.floor(Date.now() / 1000) + 60 * 60; // default 1h
    const ttl = Math.max(expiresAt - Math.floor(Date.now() / 1000), 0);

    if (isRedisAvailable()) {
      const redis = getRedisClient();
      if (redis) {
        // SETEX: set with expiration (in seconds)
        await redis.setEx(`blacklist:${token}`, ttl, 'revoked');
        return true;
      }
    }

    // Fallback: in-memory
    memoryStore.set(token, { expiresAt });
    return true;
  } catch (err) {
    return false;
  }
};

export const isBlacklisted = async (token: string): Promise<boolean> => {
  if (!token) return false;

  try {
    if (isRedisAvailable()) {
      const redis = getRedisClient();
      if (redis) {
        const result = await redis.get(`blacklist:${token}`);
        return result !== null;
      }
    }

    // Fallback: in-memory
    const entry = memoryStore.get(token);
    if (!entry) return false;
    const now = Date.now() / 1000;
    if (entry.expiresAt <= now) {
      memoryStore.delete(token);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[tokenBlacklist] Error checking blacklist:', err);
    return false;
  }
};

export default { addToBlacklist, isBlacklisted };
