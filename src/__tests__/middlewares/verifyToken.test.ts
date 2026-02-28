import { verifyToken } from '@/middlewares/verifyToken.middleware';
import * as jwtUtils from '@/utils/jwt';

jest.mock('@/utils/jwt');

const mockedJwtVerify = jwtUtils.jwtVerify as jest.MockedFunction<typeof jwtUtils.jwtVerify>;

function createMocks(headers?: Record<string, string>, query?: Record<string, any>) {
  const req: any = {
    header: (name: string) => headers?.[name.toLowerCase()] || headers?.[name] || undefined,
    query: query || {},
  };
  const json = jest.fn();
  const res: any = { status: jest.fn().mockReturnValue({ json }), json };
  const next = jest.fn();
  return { req, res, next, json };
}

describe('verifyToken middleware', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns 401 when missing token', () => {
    const { req, res, next } = createMocks();
    verifyToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.status().json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 on invalid token', () => {
    mockedJwtVerify.mockImplementation(() => {
      throw new Error('invalid');
    });
    const { req, res, next } = createMocks({ Authorization: 'Bearer invalid' });
    verifyToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.status().json).toHaveBeenCalledWith(expect.objectContaining({ code: 'INVALID_TOKEN' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('returns TOKEN_EXPIRED when jwtVerify throws TokenExpiredError', () => {
    const tokenExpiredError = new (require('jsonwebtoken').TokenExpiredError)('jwt expired', new Date());
    mockedJwtVerify.mockImplementation(() => {
      throw tokenExpiredError;
    });
    const { req, res, next } = createMocks({ Authorization: 'Bearer expired' });
    verifyToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.status().json).toHaveBeenCalledWith(expect.objectContaining({ code: 'TOKEN_EXPIRED' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and attaches req.user on valid token', () => {
    mockedJwtVerify.mockReturnValue({ _id: 'abc123' } as any);
    const { req, res, next } = createMocks({ Authorization: 'Bearer valid' });
    verifyToken(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).user).toEqual({ _id: 'abc123' });
  });
});
