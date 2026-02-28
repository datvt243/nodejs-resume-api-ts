/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import jwt from 'jsonwebtoken';

/**
 * Lightweight token blacklist with in-memory fallback.
 * If you later add Redis, replace implementation here.
 */

type Entry = { expiresAt: number };

const store = new Map<string, Entry>();

// cleanup expired entries periodically
const _cleanup = setInterval(() => {
  const now = Date.now() / 1000;
  for (const [token, entry] of store) {
    if (entry.expiresAt <= now) store.delete(token);
  }
}, 60 * 1000);
// do not keep node process alive for tests
if (typeof (_cleanup as any).unref === 'function') (_cleanup as any).unref();

export const addToBlacklist = (token: string) => {
  try {
    const decoded = jwt.decode(token) as any;
    const exp = decoded?.exp as number | undefined;
    const expiresAt = exp || Math.floor(Date.now() / 1000) + 60 * 60; // default 1h
    store.set(token, { expiresAt });
    return true;
  } catch (err) {
    return false;
  }
};

export const isBlacklisted = (token: string) => {
  if (!token) return false;
  const entry = store.get(token);
  if (!entry) return false;
  const now = Date.now() / 1000;
  if (entry.expiresAt <= now) {
    store.delete(token);
    return false;
  }
  return true;
};

export default { addToBlacklist, isBlacklisted };
