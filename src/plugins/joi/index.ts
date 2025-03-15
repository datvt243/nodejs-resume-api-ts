/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import Joi, { StringSchema, NumberSchema } from 'joi';
import { phoneRegex } from '@/config/regex.config';

export enum JoiSchemaTypesConst {
  STRING = 'string',
  NUMBER = 'number',
  EMAIL = 'email',
  PWD = 'password'
}

export type JoiSchemaTypes =
    | Joi.StringSchema
    | Joi.NumberSchema
    | Joi.BooleanSchema
    | Joi.DateSchema
    | Joi.ArraySchema
    | Joi.ObjectSchema<any>  // Có thể chứa bất kỳ object nào
    | Joi.AlternativesSchema // Hỗ trợ nhiều kiểu dữ liệu (e.g., string | number)
    | Joi.BinarySchema       // Hỗ trợ Buffer, file
    | Joi.FunctionSchema     // Hỗ trợ function
    | Joi.LinkSchema         // Schema liên kết đến schema khác
    | Joi.AnySchema;         // Schema chấp nhận mọi kiểu dữ liệu

interface JoiProps {
  value?: any,
  message?: string
}
interface RenderJoiProps {
  [key: string]: {
    value?: any,
    message: string
  }
}

export const password = Joi.string().min(5).trim().strict().required().messages({
    'any.required': 'Password là bắt buộc',
    'string.empty': 'Password không được rỗng',
});

export const renderJoi = (type: string, opts?: RenderJoiProps) => {
  let schema;

  switch (type) {
    case JoiSchemaTypesConst.STRING:
      schema = Joi.string();
      setJoiOptions(schema, type, opts);
      break;
    case JoiSchemaTypesConst.NUMBER:
      schema = Joi.number();
      setJoiOptions(schema, type, opts);
      break;
    case JoiSchemaTypesConst.EMAIL:
      schema = Joi.string().email();
      setJoiOptions(schema, type, opts);
      break
    case JoiSchemaTypesConst.PWD:
      schema = Joi.string().min(8).trim().strict().required().messages({
        'string.required': 'Password là bắt buộc',
        'string.empty': 'Password không được rỗng',
      });
      break;
    default:
      schema = Joi.string().trim().strict();
  }

  return schema
  
}

function setJoiOptions(schema: any, type: string, opts: Record<string, JoiProps> = {}) {
  const _message: Record<string, string> = ((t) => {
    const result: Record<string, string> = {};
    switch (t) {
      case 'email':
        result['string.email'] = 'Email không đúng định dạng';
        break;
    }
    return result;
  })(type);

  for (const key of ['min', 'max']) {
    if (!opts?.[key]) continue;
    const { value = 1, message = '' } = opts[key];
    schema?.[`${key}`]?.(value);
    _message[`${type}.${key}`] = message;
  }

  schema.trim().strict();

  if (opts?.required) {
    schema.required();
    _message[`${type}.required`] = `${type.toUpperCase()} là bắt buộc`;
  }

  schema.message(_message);
  
}