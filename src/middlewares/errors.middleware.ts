/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { NODE_ENV } from '@/config/process.config';
import { _log } from '@/utils';

type ErrorMid = Error | ReferenceError | TypeError;
export const errorsMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err?.statusCode || err?.status || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err?.message || 'Internal Server Error';

  _log({
    text: `ERROR: ${message}`,
    type: 'error',
  });

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(NODE_ENV === 'development' && { stack: err?.stack }),
  });
};
