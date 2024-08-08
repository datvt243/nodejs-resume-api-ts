"use strict";
/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fnUpdateFields = exports.fnUpdate = exports.fnGetInformationByEmail = exports.fnGetInformationById = void 0;
const http_status_codes_1 = require("http-status-codes");
const utils_1 = require("@/utils");
const candidate_validate_1 = require("@/candidate/candidate.validate");
const candidate_service_1 = require("@/candidate/candidate.service");
const fnGetInformationById = async (req, res) => {
    const { id = '' } = req.params;
    const doc = await (0, candidate_service_1.handlerGetInformationById)(id);
    const _flag = !!doc;
    return (0, utils_1.formatReturn)(res, { success: _flag, message: _flag ? '' : 'Không tìm thấy người dùng', data: doc });
};
exports.fnGetInformationById = fnGetInformationById;
const fnGetInformationByEmail = async (req, res) => {
    const { email = '' } = req.params;
    const doc = await (0, candidate_service_1.handlerGetInformationByEmail)(email);
    const _flag = !!doc;
    return (0, utils_1.formatReturn)(res, { success: _flag, message: _flag ? '' : 'Không tìm thấy người dùng', data: doc });
};
exports.fnGetInformationByEmail = fnGetInformationByEmail;
const fnUpdate = async (req, res) => {
    /**
     * validate data come from req.body
     */
    const { isValidated, value, errors } = (0, utils_1.validateSchema)({ schema: candidate_validate_1.schemaCandidate, item: { ...req.body } });
    if (!isValidated)
        return (0, utils_1.formatReturn)(res, { statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED, success: false, message: 'Xảy ra lỗi', errors });
    /**
     * update data
     */
    try {
        const _result = await (0, candidate_service_1.handlerUpdate)(value);
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
        schema: candidate_validate_1.schemaCandidatePatch,
        item: { ...req.body },
    });
    if (!isValidated)
        return (0, utils_1.formatReturn)(res, { statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED, success: false, message: 'Xảy ra lỗi', errors });
    /**
     * update data
     */
    try {
        const _result = await (0, candidate_service_1.handlerUpdate)(value);
        return (0, utils_1.formatReturn)(res, { ..._result });
    }
    catch (err) {
        (0, utils_1._throwError)(res, err);
    }
};
exports.fnUpdateFields = fnUpdateFields;
