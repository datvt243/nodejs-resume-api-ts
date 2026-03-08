/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Utility functions for HTTP responses and error handling
 */
import { Response, NextFunction, Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { BaseReturn } from '@/types/base.type.ts';
import {
  AppError,
  ErrorCode,
  ValidationError,
  BadRequestError,
  NotFoundError,
  ConflictError,
  IErrorOptions,
  IErrorOptionsWithStatus,
} from '@/errors';

interface formatReturn extends BaseReturn {
  statusCode?: null | number;
  statusCodeSuccess?: string;
  statusCodeFailed?: string;
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * Use this wrapper instead of try-catch blocks in async controllers
 *
 * @example
 * app.get('/users', asyncHandler(async (req, res, next) => {
 *   const users = await User.find();
 *   res.json(users);
 * }));
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Legacy function - Throws a BadRequestError
 * Kept for backward compatibility
 * @deprecated Use custom error classes instead
 */
export const throwError = (res: Response, message: any): void => {
  throw new BadRequestError({ message: message || 'Something wrong bro!!!' });
};

/**
 * Throws a ValidationError with formatted validation errors
 */
export const throwValidationError = (options: IErrorOptions): never => {
  throw new ValidationError(options);
};

/**
 * Throws a NotFoundError
 */
export const throwNotFoundError = (options: IErrorOptions = {}): never => {
  throw new NotFoundError({
    message: options.message || 'Resource not found',
    errors: options.errors,
  });
};

/**
 * Throws a ConflictError (e.g., duplicate resource)
 */
export const throwConflictError = (options: IErrorOptions = {}): never => {
  throw new ConflictError({
    message: options.message || 'Resource already exists',
    errors: options.errors,
  });
};

/**
 * Throws a BadRequestError
 */
export const throwBadRequestError = (options: IErrorOptions): never => {
  throw new BadRequestError(options);
};

/**
 * Pass error to global error handler via next()
 * Use this in catch blocks to forward errors to middleware
 */
export const handleError = (err: any, next: NextFunction): void => {
  // If it's already an AppError, pass it through
  if (err instanceof AppError) {
    return next(err);
  }

  // If it's a Mongoose CastError (invalid ObjectId)
  if (err?.name === 'CastError') {
    return next(
      new BadRequestError({
        message: 'Invalid ID format',
        errors: err.message,
      }),
    );
  }

  // If it's a Mongoose duplicate key error
  if (err?.code === 11000) {
    const field = Object.keys(err?.keyValue || {})[0] || 'field';
    return next(new ConflictError({ message: `${field} already exists` }));
  }

  // If it's a Mongoose validation error
  if (err?.name === 'ValidationError') {
    const details = Object.values(err?.errors || {}).map((e: any) => e.message);
    return next(new ValidationError({ message: 'Validation failed', errors: details }));
  }

  // Default to internal server error
  return next(new AppError({ message: err?.message || 'Internal Server Error', statusCode: StatusCodes.INTERNAL_SERVER_ERROR }));
};

/**
 * Format bad request response (legacy function)
 * @deprecated Use formatReturn with AppError instead
 */
export const resBadRequest = (res: Response, error: string | { message: string; [key: string]: any }) => {
  let errors: string[] = [];
  if (typeof error === 'string') {
    errors.push(error);
  } else if (typeof error === 'object') {
    if (Array.isArray(error)) {
      errors = error;
    } else {
      const { details = [] } = error;
      errors = details.map((i: any) => i?.message || '');
    }
  }

  res.status(StatusCodes.BAD_REQUEST).json({
    errors,
    data: null,
  });
};

/**
 * Standard response formatter
 */
export const formatResponse = (props: BaseReturn) => {
  /**
   * Chuẩn data trả về của API
   *  {
   *      success: boolean        // trạng thái
   *      message: string         // mess thành công or thất bại
   *      error: string | array   // danh sách lỗi
   *      data: null | object{ token: string, user: object{ _id, name } } //  data trả về gồm token và thông tin user
   *  }
   */
  const { type = '', success, message, errors = {}, data } = props;

  const getData = (() => {
    if (!success) return null;
    if (type === 'register') return null;
    if (type === 'login') {
      const { token = '', user = null } = data as { token: string; user: null | Record<string, string> };
      return { token, user };
    }
    return data;
  })();

  return {
    success,
    message,
    errors,
    data: getData,
  };
};

/**
 * Format and send response with status
 */
export const resFormatResponse = (res: Response, status: number, props: BaseReturn) => {
  res.status(status).json(formatResponse(props));
};

/**
 * Format and send standardized API response
 * Main utility function for controller responses
 */
export const formatReturn = (res: Response, props: formatReturn) => {
  const {
    success = false,
    message = '',
    errors = null,
    data = null,
    statusCode = null,
    statusCodeSuccess = 'OK',
    statusCodeFailed = 'BAD_REQUEST',
  } = props;

  const _statusCode: number = (() => {
    if (statusCode) return statusCode;
    if (success) return StatusCodes['OK'];
    return StatusCodes['BAD_REQUEST'];
  })();

  return res.status(_statusCode).json(
    formatResponse({
      success,
      message,
      errors,
      data,
    }),
  );
};

/**
 * Success response helper
 */
export const successResponse = (res: Response, data: any = null, message: string = 'Success') => {
  return formatReturn(res, {
    success: true,
    message,
    data,
    statusCode: StatusCodes.OK,
  });
};

/**
 * Error response helper (uses global error handler via next)
 */
export const errorResponse = (next: NextFunction, error: AppError | Error): void => {
  if (error instanceof AppError) {
    return next(error);
  }
  return next(new AppError({ message: error.message || 'Internal Server Error', statusCode: StatusCodes.INTERNAL_SERVER_ERROR }));
};
