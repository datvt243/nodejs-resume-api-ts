/**
 * Timeout utilities for async operations
 */

const DB_TIMEOUT = 5000; // 5s for DB ops
const REDIS_TIMEOUT = 2000; // 2s for Redis
const CONNECT_TIMEOUT = 10000; // 10s for connections

/**
 * Promise timeout wrapper with AbortController
 */
export const withTimeout = <T>(promise: Promise<T>, ms: number, signal?: AbortSignal): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${ms}ms`));
      }, ms);
      if (signal) {
        signal.addEventListener('abort', () => clearTimeout(timeoutId));
      }
    }),
  ]);
};

/**
 * Pre-configured timeouts
 */
export const withDBTimeout = <T>(promise: Promise<T>, signal?: AbortSignal) => withTimeout(promise, DB_TIMEOUT, signal);
export const withRedisTimeout = <T>(promise: Promise<T>, signal?: AbortSignal) => withTimeout(promise, REDIS_TIMEOUT, signal);
export const withConnectTimeout = <T>(promise: Promise<T>, signal?: AbortSignal) => withTimeout(promise, CONNECT_TIMEOUT, signal);

export { DB_TIMEOUT, REDIS_TIMEOUT, CONNECT_TIMEOUT };
export default withTimeout;
