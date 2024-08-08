/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { NODE_ENV } from '@/config/process.config';
import { _log } from '@/utils';

export const errorsMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    _log('***** WARNING!!! Ops! we got a problem');

    let _message = '',
        _code = StatusCodes.BAD_REQUEST;

    if (err instanceof ReferenceError) {
        _message = err.message;
    } else {
        _message = 'Lỗi không xác định';
        _code = 404;
    }

    res.status(_code || 404).json({
        message: _message,
        stack: NODE_ENV === 'development' ? err.stack : null,
    });
};