/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import mongoose, { Model } from 'mongoose';
import { Schema } from 'joi';
import { _log } from '@/utils';
import { t, tErrorType, DEFAULT_LANG } from '@/utils/i18n';

export const validateSchema = ({
  schema,
  item = {},
  lang = DEFAULT_LANG,
}: {
  schema: Schema;
  item: Partial<Record<string, any>>;
  lang?: string;
}) => {
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
    return { isValidated: false, message: t('validation.invalidSchema', lang) };
  }
  const { error, value } = schema.validate(item, validationOptions);
  return error
    ? { isValidated: false, message: t('validation.hasErrors', lang), errors: formatValidateError(error, lang) }
    : { isValidated: true, value, message: '' };
};

/**
 * Translate a single Joi error detail using a generic, per-error-type
 * template (`joiErrors.<type>`) + a translated field label
 * (`fieldLabels.<key>`) — this ignores whatever `.messages({...})` string
 * was set on the schema itself, since those are baked in at module-load
 * time in one hardcoded language and can't respond to a per-request
 * Accept-Language. Falls back to Joi's own rendered message if the error
 * type isn't in our template dictionary (better a real message in the
 * wrong language than nothing).
 */
const translateJoiDetail = (detail: any, lang: string): string => {
  const template = tErrorType(detail.type, lang);
  if (template === undefined) return detail.message;

  const fieldKey = detail?.context?.key ?? detail?.path?.[detail.path.length - 1];
  const labelKey = `fieldLabels.${fieldKey}`;
  const translatedLabel = t(labelKey, lang);
  const label = translatedLabel === labelKey ? detail?.context?.label || fieldKey : translatedLabel;

  return template.replace('{{label}}', label).replace('{{limit}}', String(detail?.context?.limit ?? ''));
};

export const formatValidateError = (error: any, lang: string = DEFAULT_LANG) => {
  const { details = [] } = error;

  const messages: Record<string, any> = {};

  for (const detail of details) {
    const _field = detail?.path[0];
    if (!_field) continue;
    messages[_field] = translateJoiDetail(detail, lang);
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
