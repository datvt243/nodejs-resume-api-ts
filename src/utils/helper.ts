/**
 * Utility functions for HTTP responses and error handling
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
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
}

/**
 * Derive a Mongoose `select` string from the keys of an update payload
 */
export const getSelectFields = (fields: Record<string, unknown>): string => Object.keys(fields).join(', ');

/**
 * Pass error to global error handler via next()
 * Use this in catch blocks to forward errors to middleware
 */
export const handleError = ({
  err,
  next,
  lang = DEFAULT_LANG,
}: {
  err: unknown;
  next: NextFunction;
  lang?: string | undefined;
}): void => {
  if (err instanceof AppError) {
    return next(err);
  }

  if (err instanceof mongoose.Error.CastError) {
    return next(
      new BadRequestError({
        message: t('errors.invalidIdFormat', lang),
        errors: err.message,
      }),
    );
  }

  if (isDuplicateKeyError(err)) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return next(new ConflictError({ message: t('errors.duplicateKey', lang).replace('{{field}}', field) }));
  }

  /**
   * Mongoose validation error — translate each field's error using the
   * same generic error-type + field-label approach as Joi (see
   * utils/valid.ts). Only `required` is currently used by any model's
   * schema; anything else falls back to Mongoose's own hardcoded message.
   */
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

  const message = err instanceof Error ? err.message : undefined;
  return next(new AppError({ message: message || t('errors.internalServerError', lang), statusCode: StatusCodes.INTERNAL_SERVER_ERROR }));
};

export const formatResponse = (props: BaseReturn) => {
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

export const formatReturn = (res: Response, props: formatReturn) => {
  const {
    success = false,
    message = '',
    errors = null,
    data = null,
    statusCode = null,
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
