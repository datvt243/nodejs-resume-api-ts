/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { schemaEducation } from './education.validate';
import { handlerCreate, handlerUpdate } from './education.service';
import { formatReturn, validateSchema, handleError } from '@/utils';

const SCHEMA = schemaEducation;

export const fnCreate = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * validate data gửi lên
   */
  const { isValidated, value = {}, errors } = validateSchema({ schema: SCHEMA, item: { ...req.body } });
  if (!isValidated) return formatReturn(res, { success: false, message: 'Lỗi validate', errors });

  /**
   * save mới document
   */
  try {
    !value.isCurrent && (value.isCurrent = false);
    const _result = await handlerCreate(value);
    return formatReturn(res, { statusCode: StatusCodes.CREATED, ..._result });
  } catch (err) {
    handleError(err, next);
  }
};

export const fnUpdate = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * validate data gửi lên
   */
  const { isValidated, value = {}, errors } = validateSchema({ schema: SCHEMA, item: { ...req.body } });
  if (!isValidated) return formatReturn(res, { success: false, message: 'Lỗi validate', errors });

  /**
   * update document
   */
  try {
    !value.isCurrent && (value.isCurrent = false);
    const _result = await handlerUpdate(value);
    return formatReturn(res, { ..._result });
  } catch (err) {
    handleError(err, next);
  }
};
