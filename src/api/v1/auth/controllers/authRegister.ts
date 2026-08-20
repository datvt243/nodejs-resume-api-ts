/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { validateSchema, formatReturn, handleError } from '@/utils';

import { schemaAuthRegister } from '../vaidations';
import { handlerRegister } from '../services';

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
