/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import mongoose, { Model } from 'mongoose';
import { _log } from '@/utils/index.ts';

export const validateSchema = (props: { schema: any; item: Record<string, any> }) => {
    /**
     * @return
     *  isValidated: boolean,
     *  value?: object,
     *  message?: object,
     *  error?: array
     *
     */

    const { schema = null, item = {} } = props;
    const message = 'Validation has errors';
    if (!schema || !item || !Object.keys(item).length) {
        return {
            isValidated: false,
            message,
        };
    }

    const validOpt = { abortEarly: false }; // Báo lỗi tất cả 1 lượt
    const { error, value } = schema.validate({ ...item }, validOpt);

    if (error) return { isValidated: false, message, errors: formatValidateError(error) };

    return {
        isValidated: true,
        value,
        message: '',
    };
};

const formatValidateError = (error: any) => {
    const { details = [] } = error;

    const messages: Record<string, any> = {};

    for (const detail of details) {
        const _field = detail?.path[0],
            _mess = detail.message;

        _mess && (messages[_field] = _mess);
    }
    return messages;
};

export const validateModel = async (model: any, value: Record<string, any>) => {
    var valid = true,
        message = '',
        errors: string[] = [];

    try {
        await model.validate(value);
    } catch (err) {
        valid = false;
        if (err instanceof mongoose.Error.ValidationError) {
            const { message: _mes, errors: _errs } = err;
            message = _mes;
            for (const [k, v] of Object.entries(_errs)) {
                errors.push(k);
            }
        } else {
            message = 'An error occurred';
            /*  errors = []; */
        }
    }
    return { valid, message, errors };
};
