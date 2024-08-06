/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { formatReturn, validateSchema, _throwError } from '@/utils';
import { schemaCandidate, schemaCandidatePatch } from '@/candidate/candidate.validate';
import { handlerUpdate, handlerGetInformationByEmail, handlerGetInformationById } from '@/candidate/candidate.service';

export const fnGetInformationById = async (req: Request, res: Response) => {
    const { id = '' } = req.params;
    const doc = await handlerGetInformationById(id);

    const _flag = !!doc;
    return formatReturn(res, { success: _flag, message: _flag ? '' : 'Không tìm thấy người dùng', data: doc });
};

export const fnGetInformationByEmail = async (req: Request, res: Response) => {
    const { email = '' } = req.params;
    const doc = await handlerGetInformationByEmail(email);
    const _flag = !!doc;
    return formatReturn(res, { success: _flag, message: _flag ? '' : 'Không tìm thấy người dùng', data: doc });
};

export const fnUpdate = async (req: Request, res: Response) => {
    /**
     * validate data come from req.body
     */
    const { isValidated, value, errors } = validateSchema({ schema: schemaCandidate, item: { ...req.body } });
    if (!isValidated)
        return formatReturn(res, { statusCode: StatusCodes.UNAUTHORIZED, success: false, message: 'Xảy ra lỗi', errors });

    /**
     * update data
     */
    try {
        const _result = await handlerUpdate(value);
        return formatReturn(res, { ..._result });
    } catch (err) {
        _throwError(res, err);
    }
};

export const fnUpdateFields = async (req: Request, res: Response) => {
    /**
     * validate data gửi lên
     */
    const { isValidated, value, errors } = validateSchema({
        schema: schemaCandidatePatch,
        item: { ...req.body },
    });
    if (!isValidated)
        return formatReturn(res, { statusCode: StatusCodes.UNAUTHORIZED, success: false, message: 'Xảy ra lỗi', errors });

    /**
     * update data
     */
    try {
        const _result = await handlerUpdate(value);
        return formatReturn(res, { ..._result });
    } catch (err) {
        _throwError(res, err);
    }
};
