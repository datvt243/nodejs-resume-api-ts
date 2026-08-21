/**
 * Chức năng Refresh token
 */
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { formatReturn, handleError } from '@/utils';
import { addToBlacklist, isBlacklisted } from '@/utils/tokenBlacklist';
import { jwtSign, jwtVerify } from '@/utils';
import { extractTokenFromRequest } from '@/utils/helper-auth';
import { TOKEN_SECRET, TOKEN_REFRESH } from '@/config/process.config';

export const authRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // pull from multiple locations using helper
    const refreshToken = extractTokenFromRequest(req, 'refreshToken');

    if (!refreshToken) {
      return formatReturn(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success: false,
        message: 'No refresh token provided',
      });
    }

    if (await isBlacklisted(refreshToken)) {
      return formatReturn(res, {
        statusCode: StatusCodes.FORBIDDEN,
        success: false,
        message: 'Refresh token revoked',
      });
    }

    // verify refresh token
    const decoded = jwtVerify(refreshToken, TOKEN_REFRESH);
    const { _id } = (decoded as { _id?: string }) || {};
    if (!_id)
      return formatReturn(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success: false,
        message: 'Invalid refresh token payload',
      });

    // rotate: blacklist old refresh token
    await addToBlacklist(refreshToken);

    // create new tokens
    const newAccess = jwtSign({ _id }, TOKEN_SECRET);
    const newRefresh = jwtSign({ _id }, TOKEN_REFRESH);

    return formatReturn(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Token refreshed',
      data: { token: newAccess, tokenRefresh: newRefresh },
    });
  } catch (err) {
    handleError(err, next, (req as any).lang);
  }
};
