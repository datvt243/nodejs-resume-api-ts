/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { validateSchema, formatReturn, handleError, throwBadRequestError } from '@/utils';

import { schemaAuthRegister, schemaAuthLogin } from './auth.validate';
import { handlerRegister, handlerLogin } from './auth.service';
import { addToBlacklist, isBlacklisted } from '@/utils/tokenBlacklist';
import { jwtSign, jwtVerify } from '@/utils';
import { extractTokenFromRequest } from '@/utils/helper-auth';
import { TOKEN_SECRET, TOKEN_REFRESH, TOKEN_EXP_IN, TOKEN_REFRESH_EXP_IN } from '@/config/process.config';

/**
 * Chức năng Đăng ký mới
 */
export const authRegister = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * validate dữ liệu đầu vào
   * { email, password, re-password } = req.body;
   */
  const { isValidated, value = {}, errors, message } = validateSchema({ schema: schemaAuthRegister, item: { ...req.body } });
  if (!isValidated) {
    return formatReturn(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message,
      errors,
    });
  }

  /**
   * save mới document
   */
  try {
    const { success, message } = await handlerRegister({ _id: null, ...value });
    return formatReturn(res, {
      statusCode: StatusCodes[success ? 'OK' : 'UNAUTHORIZED'],
      success: success,
      message: message || 'Đăng ký thành công',
      errors: null,
      data: null,
    });
  } catch (err) {
    handleError(err, next);
  }
};

/**
 * Chức năng Đăng nhập
 */
export const authLogin = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * validate date come from req
   */
  const { isValidated, value = {}, message, errors } = validateSchema({ schema: schemaAuthLogin, item: { ...req.body } });
  if (!isValidated) {
    return formatReturn(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message,
      errors,
    });
  }

  /**
   * tiến hành Login
   */
  try {
    const _result = await handlerLogin({ email: value.email, password: value.password });

    return formatReturn(res, {
      statusCode: StatusCodes[_result?.success ? 'OK' : 'UNAUTHORIZED'],
      success: _result?.success || false,
      message: _result?.message || 'Login thất bại',
      errors: _result?.errors || [],
      data: _result?.data || null,
    });
  } catch (err) {
    handleError(err, next);
  }
};

/**
 * Chức năng Refresh token
 */
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
    const newAccess = jwtSign({ _id }, TOKEN_SECRET, { expiresIn: TOKEN_EXP_IN || '1h' });
    const newRefresh = jwtSign({ _id }, TOKEN_REFRESH, { expiresIn: TOKEN_REFRESH_EXP_IN });

    return formatReturn(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Token refreshed',
      data: { token: newAccess, tokenRefresh: newRefresh },
    });
  } catch (err) {
    handleError(err, next);
  }
};

/**
 * Chức năng Tạo mới refreshToken
 */
export const authCreateRefreshToken = async (req: Request, res: Response) => {
  // coming soon
};

/**
 * Chức năng Logout: thu hồi access token hiện tại
 */
export const authLogout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // attempt to extract token from header/cookie/query
    const token = extractTokenFromRequest(req);

    if (!token) {
      return formatReturn(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: 'No token provided to logout',
      });
    }

    await addToBlacklist(token);

    return formatReturn(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    handleError(err, next);
  }
};
