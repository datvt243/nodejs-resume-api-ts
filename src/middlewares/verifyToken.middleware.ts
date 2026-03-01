// comming soon

/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { TOKEN_SECRET } from '@/config/process.config';
import { jwtVerify } from '@/utils/jwt';
import { isBlacklisted } from '@/utils/tokenBlacklist';
import jwt from 'jsonwebtoken';

import { extractTokenFromRequest } from '@/utils/helper-auth';

// note: `fieldName` defaults to 'token', so middleware does not need to pass it
const extractToken = (req: any): string | null => extractTokenFromRequest(req);

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      code: 'NO_TOKEN',
      message: 'Access denied. No token provided.',
      invalidToken: true,
    });
  }

  try {
    // check revoked tokens
    if (await isBlacklisted(token)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        code: 'TOKEN_REVOKED',
        message: 'Token has been revoked.',
        invalidToken: true,
      });
    }
    const decoded = jwtVerify(token, TOKEN_SECRET);
    const { _id } = (decoded as { _id?: string }) || {};

    if (!_id) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Invalid token payload.',
        invalidToken: true,
      });
    }

    // attach authenticated user info without mutating body
    (req as any).user = { _id };
    return next();
  } catch (err: any) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Token expired.',
        expired: true,
        invalidToken: true,
      });
    }

    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: err?.message || 'Invalid token.',
      invalidToken: true,
    });
  }
};

export const verifyTokenByQuery = (req: Request, res: Response, next: NextFunction) => {
  // keep for compatibility; extractToken already supports query param
  return verifyToken(req, res, next);
};
