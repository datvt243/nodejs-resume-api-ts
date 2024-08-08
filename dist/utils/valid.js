"use strict";
/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateModel = exports.validateSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const validateSchema = (props) => {
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
    if (error)
        return { isValidated: false, message, errors: formatValidateError(error) };
    return {
        isValidated: true,
        value,
        message: '',
    };
};
exports.validateSchema = validateSchema;
const formatValidateError = (error) => {
    const { details = [] } = error;
    const messages = {};
    for (const detail of details) {
        const _field = detail?.path[0], _mess = detail.message;
        _mess && (messages[_field] = _mess);
    }
    return messages;
};
const validateModel = async (model, value) => {
    var valid = true, message = '', errors = [];
    try {
        await model.validate(value);
    }
    catch (err) {
        valid = false;
        if (err instanceof mongoose_1.default.Error.ValidationError) {
            const { message: _mes, errors: _errs } = err;
            message = _mes;
            for (const [k, v] of Object.entries(_errs)) {
                errors.push(k);
            }
        }
        else {
            message = 'An error occurred';
            /*  errors = []; */
        }
    }
    return { valid, message, errors };
};
exports.validateModel = validateModel;
