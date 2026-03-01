import { createRateLimiter, memStore, startMemStoreCleanup, stopMemStoreCleanup } from '@/middlewares/rateLimit.middleware';

describe('rateLimit middleware (in-memory)', () => {
  beforeEach(() => {
    memStore.clear();
    jest.clearAllMocks();
  });

  it('allows requests up to max and blocks afterwards', async () => {
    const limiter = createRateLimiter({ max: 2, windowMs: 60 * 60 * 1000, keyPrefix: 'test-rl' });

    const makeReq = (ip: string) => ({ ip, socket: { remoteAddress: ip } }) as any;
    const res: any = { setHeader: jest.fn(), status: jest.fn().mockReturnValue({ json: jest.fn() }) };
    const next = jest.fn();

    await limiter(makeReq('1.2.3.4'), res, next);
    expect(next).toHaveBeenCalledTimes(1);

    await limiter(makeReq('1.2.3.4'), res, next);
    expect(next).toHaveBeenCalledTimes(2);

    await limiter(makeReq('1.2.3.4'), res, next);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('separates limits by IP', async () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60 * 60 * 1000, keyPrefix: 'test-rl' });
    const res: any = { setHeader: jest.fn(), status: jest.fn().mockReturnValue({ json: jest.fn() }) };
    const next = jest.fn();

    await limiter({ ip: 'a', socket: { remoteAddress: 'a' } } as any, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    await limiter({ ip: 'b', socket: { remoteAddress: 'b' } } as any, res, next);
    expect(next).toHaveBeenCalledTimes(2);
  });
});

describe('memStore cleanup job', () => {
  afterEach(() => {
    try {
      stopMemStoreCleanup();
    } catch (e) {
      // ignore
    }
    memStore.clear();
    jest.useRealTimers();
  });

  it('removes expired entries when cleanup runs', async () => {
    jest.useFakeTimers();
    const key = 'cleanup-test:1.2.3.5';
    const now = Date.now();
    memStore.set(key, { count: 1, reset: now - 1000 });

    startMemStoreCleanup(1000);

    // advance timers to trigger cleanup
    jest.advanceTimersByTime(1000);

    // allow scheduled task to run
    await Promise.resolve();

    expect(memStore.has(key)).toBe(false);
  });
});
