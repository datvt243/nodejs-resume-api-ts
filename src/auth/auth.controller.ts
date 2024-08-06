/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { validateSchema, formatReturn, _throwError } from '@/utils';

import { schemaAuthRegister, schemaAuthLogin } from './auth.validate';
import { handlerRegister, handlerLogin } from './auth.service';

/**
 * Chức năng Đăng ký mới
 */
export const authRegister = async (req: Request, res: Response) => {
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
        _throwError(res, err);
    }
};

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

/**
 * Chức năng Refresh token
 */
export const authRefreshToken = async (req: Request, res: Response) => {
    // coming soon
};

/**
 * Chức năng Tạo mới RefreshToken
 */
export const authCreateRefreshToken = async (req: Request, res: Response) => {
    // coming soon
};
