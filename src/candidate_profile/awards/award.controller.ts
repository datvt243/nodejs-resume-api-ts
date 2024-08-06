/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import { Response, Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { schemaAward } from './award.validate';
import { handlerCreate, handlerUpdate } from './award.service';
import { validateSchema, formatReturn, _throwError } from '@/utils/index';

const SCHEMA = schemaAward;

export const fnCreate = async (req: Request, res: Response) => {
    /**
     * validate data gửi lên
     */
    const { isValidated, value = {}, errors, message } = validateSchema({ schema: SCHEMA, item: { ...req.body } });
    if (!isValidated) return formatReturn(res, { success: false, message, errors });

    /**
     * save mới document
     */
    try {
        !value.isNoExpiration && (value.isNoExpiration = false);
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
    const {
        isValidated,
        value = {},
        errors,
        message,
    } = validateSchema({
        schema: SCHEMA,
        item: { ...req.body },
    });
    if (!isValidated) return formatReturn(res, { success: false, message, errors });

    /**
     * update document
     */
    try {
        !value.isNoExpiration && (value.isNoExpiration = false);
        const _result = await handlerUpdate(value);
        return formatReturn(res, { ..._result });
    } catch (err) {
        _throwError(res, err);
    }
};
