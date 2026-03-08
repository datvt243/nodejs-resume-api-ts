/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: JWT Token verification middleware
 */
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { TOKEN_SECRET } from '@/config/process.config';
import { jwtVerify } from '@/utils/jwt';
import { isBlacklisted } from '@/utils/tokenBlacklist';
import { ErrorCode, TokenExpiredError, TokenRevokedError, InvalidTokenError, AuthenticationError } from '@/errors';

import { extractTokenFromRequest } from '@/utils/helper-auth';

// note: `fieldName` defaults to 'token', so middleware does not need to pass it
const extractToken = (req: any): string | null => extractTokenFromRequest(req);

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);

  if (!token) {
    return next(new AuthenticationError('Access denied. No token provided.', ErrorCode.NO_TOKEN));
  }

  try {
    // check revoked tokens
    if (await isBlacklisted(token)) {
      return next(new TokenRevokedError('Token has been revoked.'));
    }

    const decoded = jwtVerify(token, TOKEN_SECRET);
    const { _id } = (decoded as { _id?: string }) || {};

    if (!_id) {
      return next(new InvalidTokenError('Invalid token payload.'));
    }

    // attach authenticated user info without mutating body
    (req as any).user = { _id };
    return next();
  } catch (err: any) {
    if (err?.name === 'TokenExpiredError' || err?.name === 'JsonWebTokenError') {
      return next(new TokenExpiredError('Token expired.'));
    }
    return next(new InvalidTokenError(err?.message || 'Invalid token.'));
  }
};

export const verifyTokenByQuery = (req: Request, res: Response, next: NextFunction) => {
  // keep for compatibility; extractToken already supports query param
  return verifyToken(req, res, next);
};
