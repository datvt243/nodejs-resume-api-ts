import { requestLogger } from '@/middlewares/requestLogger.middleware';
import { _log } from '@/utils';

jest.mock('@/utils', () => ({
  _log: jest.fn(),
}));

describe('requestLogger middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs method, url, status, and duration when response finishes', () => {
    const req: any = { method: 'GET', originalUrl: '/test' };
    const events: Record<string, Function[]> = {};
    const res: any = {
      statusCode: 200,
      on: (event: string, cb: Function) => {
        events[event] = events[event] || [];
        events[event].push(cb);
      },
    };
    const next = jest.fn();

    requestLogger(req, res, next);
    expect(next).toHaveBeenCalled();

    // simulate finish event
    const start = Date.now();
    // call each listener
    events['finish'].forEach((cb) => cb());

    expect(_log).toHaveBeenCalledWith(expect.stringContaining('GET /test 200 -'));
  });
});
