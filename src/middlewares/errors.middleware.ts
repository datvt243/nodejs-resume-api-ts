/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Global error handling middleware
 */
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { NODE_ENV } from '@/config/process.config';
import { _log } from '@/utils';
import { AppError, ErrorCode } from '@/errors/AppError';

type ErrorMid = Error | ReferenceError | TypeError;

export interface BaseReturn {
  type?: string;
  success?: boolean;
  message?: string;
  errors?: any;
  data?: Record<string, any>[] | Record<string, any> | null;
}

export enum Collections {
  INFORMATION = 'generalInformation',
  EXPERIENCE = 'experiences',
  EDUCATION = 'educations',
  REFERENCE = 'references',
  PROJECT = 'projects',
  CERTIFICATE = 'certificates',
  AWARD = 'awards',
}

/**
 * Global error handling middleware
 * Handles both custom AppError instances and unknown errors
 *
 * Note: asyncHandler is now available in @/utils/helper.ts
 */
export const errorsMiddleware = (err: ErrorMid | AppError, req: Request, res: Response, next: NextFunction) => {
  // Check if error is a known operational error
  if (err instanceof AppError) {
    _log({
      text: `ERROR [${err.errorCode}]: ${err.message}`,
      type: 'error',
    });

    return res.status(err.statusCode).json({
      success: false,
      errorCode: err.errorCode,
      message: err.message,
      errors: err.errors,
      ...(NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Handle unknown errors (programming errors, external library errors)
  const statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  const message = NODE_ENV === 'development' ? err.message : 'Internal Server Error';

  _log({
    text: `ERROR: ${err.message}`,
    type: 'error',
  });

  res.status(statusCode).json({
    success: false,
    errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
    message: message,
    ...(NODE_ENV === 'development' && { stack: err?.stack }),
  });
};

/**
 * Middleware to handle 404 - Route not found
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, StatusCodes.NOT_FOUND, ErrorCode.NOT_FOUND);
  next(error);
};
