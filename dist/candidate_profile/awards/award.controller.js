"use strict";
/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fnUpdate = exports.fnCreate = void 0;
const http_status_codes_1 = require("http-status-codes");
const award_validate_1 = require("./award.validate");
const award_service_1 = require("./award.service");
const index_1 = require("@/utils/index");
const SCHEMA = award_validate_1.schemaAward;
const fnCreate = async (req, res) => {
    /**
     * validate data gửi lên
     */
    const { isValidated, value = {}, errors, message } = (0, index_1.validateSchema)({ schema: SCHEMA, item: { ...req.body } });
    if (!isValidated)
        return (0, index_1.formatReturn)(res, { success: false, message, errors });
    /**
     * save mới document
     */
    try {
        !value.isNoExpiration && (value.isNoExpiration = false);
        const _result = await (0, award_service_1.handlerCreate)(value);
        return (0, index_1.formatReturn)(res, { statusCode: http_status_codes_1.StatusCodes.CREATED, ..._result });
    }
    catch (err) {
        (0, index_1._throwError)(res, err);
    }
};
exports.fnCreate = fnCreate;
const fnUpdate = async (req, res) => {
    /**
     * validate data gửi lên
     */
    const { isValidated, value = {}, errors, message, } = (0, index_1.validateSchema)({
        schema: SCHEMA,
        item: { ...req.body },
    });
    if (!isValidated)
        return (0, index_1.formatReturn)(res, { success: false, message, errors });
    /**
     * update document
     */
    try {
        !value.isNoExpiration && (value.isNoExpiration = false);
        const _result = await (0, award_service_1.handlerUpdate)(value);
        return (0, index_1.formatReturn)(res, { ..._result });
    }
    catch (err) {
        (0, index_1._throwError)(res, err);
    }
};
exports.fnUpdate = fnUpdate;
