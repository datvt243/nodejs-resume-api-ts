/**
 * Redis client singleton for token blacklist and caching.
 * Supports optional Redis configuration via REDIS_URL env var.
 */

import { createClient, RedisClientType } from 'redis';
import { REDIS_URL } from '@/config/process.config';
import { logger } from '@/logger';

let redisClient: RedisClientType | null = null;
let isConnected = false;

/**
 * Initialize Redis client if REDIS_URL is configured.
 * Non-blocking: errors are logged but won't crash server.
 */
export const initRedis = async () => {
  if (!REDIS_URL) {
    logger.info('[Redis] REDIS_URL not configured; using in-memory fallback.');
    return;
  }

  try {
    redisClient = createClient({ url: REDIS_URL });

    redisClient.on('error', (err) => {
      logger.error('[Redis] Connection error', { err: err.message, stack: (err as Error).stack });
      isConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('[Redis] Connected successfully');
      isConnected = true;
    });

    await redisClient.connect();
  } catch (err) {
    logger.error('[Redis] Failed to initialize', { err: (err as Error).message, stack: (err as Error).stack });
    redisClient = null;
  }
};

/**
 * Get Redis client or null if not connected.
 */
export const getRedisClient = (): RedisClientType | null => {
  return isConnected ? redisClient : null;
};

/**
 * Check if Redis is available.
 */
export const isRedisAvailable = (): boolean => {
  return isConnected && redisClient !== null;
};

/**
 * Cleanup Redis connection.
 */
export const closeRedis = async () => {
  if (redisClient && isConnected) {
    try {
      await redisClient.disconnect();
      logger.info('[Redis] Disconnected');
    } catch (err) {
      logger.error('[Redis] Disconnect error', { err: (err as Error).message, stack: (err as Error).stack });
    }
  }
};

export default { initRedis, getRedisClient, isRedisAvailable, closeRedis };
