"use strict";
/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fnUpdate = exports.fnCreate = void 0;
const http_status_codes_1 = require("http-status-codes");
const reference_validate_1 = require("./reference.validate");
const reference_service_1 = require("./reference.service");
const utils_1 = require("@/utils");
const SCHEMA = reference_validate_1.schemaReference;
const fnCreate = async (req, res) => {
    /**
     * validate data gửi lên
     */
    const { isValidated, value = {}, errors } = (0, utils_1.validateSchema)({ schema: SCHEMA, item: { ...req.body } });
    if (!isValidated)
        return (0, utils_1.formatReturn)(res, { success: false, message: 'Lỗi validate _', errors });
    /**
     * save mới document
     */
    try {
        const _result = await (0, reference_service_1.handlerCreate)(value);
        return (0, utils_1.formatReturn)(res, { statusCode: http_status_codes_1.StatusCodes.CREATED, ..._result });
    }
    catch (err) {
        (0, utils_1._throwError)(res, err);
    }
};
exports.fnCreate = fnCreate;
const fnUpdate = async (req, res) => {
    /**
     * validate data gửi lên
     */
    const { isValidated, value = {}, errors } = (0, utils_1.validateSchema)({ schema: SCHEMA, item: { ...req.body } });
    if (!isValidated)
        return (0, utils_1.formatReturn)(res, { success: false, message: 'Lỗi validate', errors });
    /**
     * update document
     */
    try {
        const _result = await (0, reference_service_1.handlerUpdate)(value);
        return (0, utils_1.formatReturn)(res, { ..._result });
    }
    catch (err) {
        (0, utils_1._throwError)(res, err);
    }
};
exports.fnUpdate = fnUpdate;
