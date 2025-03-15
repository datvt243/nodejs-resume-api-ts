/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { validateSchema, formatReturn, _throwError } from '@/utils';

import { schemaAuthLogin } from '../vaidations';
import { handlerLogin } from '../services';

/**
 * Chức năng Đăng nhập
 */
export const authLogin = async (req: Request, res: Response) => {
    /**
     * validate date come from req
     */
    const { isValidated, value = {}, message, errors } = validateSchema({ schema: schemaAuthLogin, item: { ...req.query } });
    if (!isValidated) {
        return formatReturn(res, {
            statusCode: StatusCodes.UNAUTHORIZED,
            success: false,
            message,
            errors,
        });
    }

    /**
     * tiến hành Login
     */
    try {
        const _result = await handlerLogin({ email: value.email, password: value.password });

        return formatReturn(res, {
            statusCode: StatusCodes[_result?.success ? 'OK' : 'UNAUTHORIZED'],
            success: _result?.success || false,
            message: _result?.message || 'Login thất bại',
            errors: _result?.errors || [],
            data: _result?.data || null,
        });
    } catch (err) {
        _throwError(res, err);
    }
};
