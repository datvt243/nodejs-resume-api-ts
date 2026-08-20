import { requestLogger } from '@/middlewares/requestLogger.middleware';
import * as utils from '@/utils';

jest.mock('@/utils', () => ({
  _log: jest.fn(),
}));

function createMocks() {
  const handlers: Record<string, () => void> = {};
  const req: any = { method: 'GET', originalUrl: '/health' };
  const res: any = {
    statusCode: 200,
    on: jest.fn((event: string, handler: () => void) => {
      handlers[event] = handler;
    }),
  };
  const next = jest.fn();
  return { req, res, next, finish: () => handlers.finish() };
}

describe('requestLogger middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls next immediately', () => {
    const { req, res, next } = createMocks();
    requestLogger(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('logs method, url, status and duration when the response finishes', () => {
    const { req, res, next, finish } = createMocks();
    requestLogger(req, res, next);
    finish();
    expect(utils._log).toHaveBeenCalledWith(expect.stringContaining('GET /health 200'));
  });
});
