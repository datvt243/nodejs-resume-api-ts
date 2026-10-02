/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Utility functions for HTTP responses and error handling
 */
import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import type { BaseReturn } from '@/types/base.type.ts';
import { AppError, ValidationError, BadRequestError, ConflictError } from '@/errors';
import { t, tErrorType, DEFAULT_LANG } from '@/utils/i18n';

/**
 * MongoDB's duplicate-key error (`E11000`) isn't one of Mongoose's own
 * exported error classes — it's the raw driver's `MongoServerError`
 * (from the `mongodb` package, a transitive dependency of `mongoose`, not
 * declared directly in `package.json`) — so it's duck-typed here instead
 * of importing a class from an undeclared dependency.
 */
const isDuplicateKeyError = (err: unknown): err is { code: 11000; keyValue?: Record<string, unknown> } =>
  typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === 11000;

interface formatReturn extends BaseReturn {
  statusCode?: null | number;
  statusCodeSuccess?: string;
  statusCodeFailed?: string;
}

/**
 * Derive a Mongoose `select` string from the keys of an update payload
 */
export const getSelectFields = (fields: Record<string, unknown>): string => Object.keys(fields).join(', ');

/**
 * Pass error to global error handler via next()
 * Use this in catch blocks to forward errors to middleware
 */
export const handleError = (err: unknown, next: NextFunction, lang: string = DEFAULT_LANG): void => {
  // If it's already an AppError, pass it through
  if (err instanceof AppError) {
    return next(err);
  }

  // If it's a Mongoose CastError (invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    return next(
      new BadRequestError({
        message: t('errors.invalidIdFormat', lang),
        errors: err.message,
      }),
    );
  }

  // If it's a Mongoose duplicate key error
  if (isDuplicateKeyError(err)) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return next(new ConflictError({ message: t('errors.duplicateKey', lang).replace('{{field}}', field) }));
  }

  // If it's a Mongoose validation error — translate each field's error using
  // the same generic error-type + field-label approach as Joi (see
  // utils/valid.ts). Only `required` is currently used by any model's
  // schema; anything else falls back to Mongoose's own hardcoded message.
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.entries(err.errors).map(([field, e]) => {
      if (e?.kind === 'required') {
        const labelKey = `fieldLabels.${field}`;
        const translatedLabel = t(labelKey, lang);
        const label = translatedLabel === labelKey ? field : translatedLabel;
        return (tErrorType('any.required', lang) ?? '{{label}}').replace('{{label}}', label);
      }
      return e.message;
    });
    return next(new ValidationError({ message: t('validation.hasErrors', lang), errors: details }));
  }

  // Default to internal server error
  const message = err instanceof Error ? err.message : undefined;
  return next(new AppError({ message: message || t('errors.internalServerError', lang), statusCode: StatusCodes.INTERNAL_SERVER_ERROR }));
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
