"use strict";
/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fnUpdateFields = exports.fnUpdate = exports.fnCreate = exports.fnGet = void 0;
const http_status_codes_1 = require("http-status-codes");
const generalInformation_service_1 = require("./generalInformation.service");
const generalInformation_validate_1 = require("./generalInformation.validate");
const utils_1 = require("@/utils");
const VALIDATE_SCHEMA = generalInformation_validate_1.schemaGeneralInformation;
const VALIDATE_SCHEMA_PATCH = generalInformation_validate_1.schemaGeneralInformationPatch;
const fnGet = async (req, res) => {
    const candidateId = req.body.candidateId || '';
    if (!candidateId)
        return (0, utils_1.formatReturn)(res, { statusCode: http_status_codes_1.StatusCodes.NOT_FOUND, data: null, message: 'Không tìm thấy data' });
    try {
        const _result = await (0, generalInformation_service_1.handlerGet)(candidateId);
        // information trả về 1 object or null
        _result.data = ((data) => {
            if (Array.isArray(data)) {
                return data.length ? data[0] : {};
            }
            return data;
        })(_result.data || []);
        return (0, utils_1.formatReturn)(res, { ..._result });
    }
    catch (err) {
        (0, utils_1._throwError)(res, err);
    }
};
exports.fnGet = fnGet;
const fnCreate = async (req, res) => {
    /**
     * validate data gửi lên
     */
    const { isValidated, value = {}, errors } = (0, utils_1.validateSchema)({ schema: VALIDATE_SCHEMA, item: { ...req.body } });
    if (!isValidated)
        return (0, utils_1.formatReturn)(res, { success: false, message: 'Lỗi validate', errors });
    /**
     * save mới document
     */
    try {
        const _result = await (0, generalInformation_service_1.handlerCreate)(value);
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
    const { isValidated, value, errors } = (0, utils_1.validateSchema)({
        schema: req.method === 'PUT' ? VALIDATE_SCHEMA : VALIDATE_SCHEMA_PATCH,
        item: { ...req.body },
    });
    if (!isValidated)
        return (0, utils_1.formatReturn)(res, { statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED, success: false, message: 'Xảy ra lỗi', errors });
    /**
     * update data
     */
    try {
        const _result = await (0, generalInformation_service_1.handlerUpdate)(value);
        return (0, utils_1.formatReturn)(res, { ..._result });
    }
    catch (err) {
        (0, utils_1._throwError)(res, err);
    }
};
exports.fnUpdate = fnUpdate;
const fnUpdateFields = async (req, res) => {
    /**
     * validate data gửi lên
     */
    const { isValidated, value, errors } = (0, utils_1.validateSchema)({
        schema: VALIDATE_SCHEMA_PATCH,
        item: { ...req.body },
    });
    if (!isValidated)
        return (0, utils_1.formatReturn)(res, { statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED, success: false, message: 'Xảy ra lỗi', errors });
    /**
     * update data
     */
    try {
        const _result = await (0, generalInformation_service_1.handlerUpdate)(value);
        return (0, utils_1.formatReturn)(res, { ..._result });
    }
    catch (err) {
        (0, utils_1._throwError)(res, err);
    }
};
exports.fnUpdateFields = fnUpdateFields;
