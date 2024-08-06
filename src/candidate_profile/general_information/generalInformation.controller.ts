/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { handlerGet, handlerCreate, handlerUpdate } from './generalInformation.service';
import { schemaGeneralInformation, schemaGeneralInformationPatch } from './generalInformation.validate';
import { formatReturn, _throwError, validateSchema } from '@/utils';

const VALIDATE_SCHEMA = schemaGeneralInformation;
const VALIDATE_SCHEMA_PATCH = schemaGeneralInformationPatch;

export const fnGet = async (req: Request, res: Response) => {
    const candidateId = req.body.candidateId || '';
    if (!candidateId) return formatReturn(res, { statusCode: StatusCodes.NOT_FOUND, data: null, message: 'Không tìm thấy data' });
    try {
        const _result = await handlerGet(candidateId);

        // information trả về 1 object or null
        _result.data = ((data) => {
            if (Array.isArray(data)) {
                return data.length ? data[0] : {};
            }
            return data;
        })(_result.data || []);

        return formatReturn(res, { ..._result });
    } catch (err) {
        _throwError(res, err);
    }
};

export const fnCreate = async (req: Request, res: Response) => {
    /**
     * validate data gửi lên
     */
    const { isValidated, value = {}, errors } = validateSchema({ schema: VALIDATE_SCHEMA, item: { ...req.body } });
    if (!isValidated) return formatReturn(res, { success: false, message: 'Lỗi validate', errors });

    /**
     * save mới document
     */
    try {
        const _result = await handlerCreate(value);
        return formatReturn(res, { statusCode: StatusCodes.CREATED, ..._result });
    } catch (err) {
        _throwError(res, err);
    }
};

export const fnUpdate = async (req: Request, res: Response) => {
    /**
     * validate data gửi lên
     */
    const { isValidated, value, errors } = validateSchema({
        schema: req.method === 'PUT' ? VALIDATE_SCHEMA : VALIDATE_SCHEMA_PATCH,
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

export const fnUpdateFields = async (req: Request, res: Response) => {
    /**
     * validate data gửi lên
     */
    const { isValidated, value, errors } = validateSchema({
        schema: VALIDATE_SCHEMA_PATCH,
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
