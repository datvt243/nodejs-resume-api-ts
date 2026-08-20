/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import mongoose, { Model } from 'mongoose';
import { Schema } from 'joi';
import { _log } from '@/utils';

export const validateSchema = ({ schema, item = {} }: { schema: Schema; item: Partial<Record<string, any>> }) => {
  /**
   * @return
   *  isValidated: boolean,
   *  value?: object,
   *  message?: object,
   *  error?: array
   *
   */
  const validationOptions = { abortEarly: false };
  if (!schema || typeof schema.validate !== 'function') {
    return { isValidated: false, message: 'Invalid schema' };
  }
  const { error, value } = schema.validate(item, validationOptions);
  return error
    ? { isValidated: false, message: 'Validation has errors', errors: formatValidateError(error) }
    : { isValidated: true, value, message: '' };
};

export const formatValidateError = (error: any) => {
  const { details = [] } = error;

  const messages: Record<string, any> = {};

  for (const detail of details) {
    const _field = detail?.path[0],
      _mess = detail.message;

    _mess && (messages[_field] = _mess);
  }
  return messages;
};

export const validateModel = async (model: any, value: Record<string, any>) => {
  var valid = true,
    message = '',
    errors: string[] = [];

  try {
    await model.validate(value);
  } catch (err) {
    valid = false;
    if (err instanceof mongoose.Error.ValidationError) {
      const { message: _mes, errors: _errs } = err;
      message = _mes;
      for (const [k, v] of Object.entries(_errs)) {
        errors.push(k);
      }
    } else {
      message = 'An error occurred';
      /*  errors = []; */
    }
  }
  return { valid, message, errors };
};
