/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
import type { BaseReturn } from '@/types/base.type.ts';
import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

interface formatReturn extends BaseReturn {
    statusCode?: null | number;
    statusCodeSuccess?: string;
    statusCodeFailed?: string;
}

export const _throwError = (res: Response, message: any): void => {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error(message || 'something wrong bro!!!');
};

export const resBadRequest = (res: Response, error: string | { message: string; [key: string]: any }) => {
    let errors = [];
    if (typeof error === 'string') {
        errors.push(error);
    } else if (typeof error === 'object') {
        if (Array.isArray(error)) {
            errors = error;
        } else {
            const { details = [] } = error;
            errors = details.map((i: any) => i?.message || '');
        }
    }

    res.status(StatusCodes.BAD_REQUEST).json({
        errors,
        data: null,
    });
};

export const formatResponse = (props: BaseReturn) => {
    /**
     * Chuẩn data trả về của API
     *  {
     *      success: boolean        // trạng thái
     *      message: string         // mess thành công or thất bại
     *      error: string | array   // danh sách lỗi
     *      data: null | object{ token: string, user: object{ _id, name } } //  data trả về gồm token và thông tin user
     *  }
     */
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

export const resFormatResponse = (res: Response, status: number, props: BaseReturn) => {
    res.status(status).json(formatResponse(props));
};

export const formatReturn = (res: Response, props: formatReturn) => {
    const {
        success = false,
        message = '',
        errors = null,
        data = null,
        statusCode = null,
        statusCodeSuccess = 'OK',
        statusCodeFailed = 'BAD_REQUEST',
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
