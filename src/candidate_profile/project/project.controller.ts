/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { schemaProject } from './project.validate';
import { handlerCreate, handlerUpdate } from './project.service';
import { validateSchema, formatReturn, _throwError } from '@/utils';

const SCHEMA = schemaProject;

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
        !value.isWorking && (value.isWorking = false);
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
        !value.isWorking && (value.isWorking = false);
        const _result = await handlerUpdate(value);
        return formatReturn(res, { ..._result });
    } catch (err) {
        _throwError(res, err);
    }
};
