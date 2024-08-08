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
exports.schemaAward = void 0;
// @ts-ignore
const joi_1 = __importDefault(require("joi"));
const joi_config_1 = require("@/config/joi.config");
exports.schemaAward = joi_1.default.object({
    _id: joi_config_1._id,
    name: (0, joi_config_1._stringDefault)({ min: 0, max: 50, title: 'Chứng chỉ' }),
    organization: (0, joi_config_1._stringDefault)({ min: 0, max: 50, title: 'Tổ chức' }),
    issueDate: joi_1.default.number().required().messages({
        'any.required': 'Ngày nhận là bắt buộc',
        'number.empty': 'Ngày nhận không được trống',
    }),
    link: (0, joi_config_1._stringDefault)({ min: 0, max: 100, title: 'Liên kết' }),
    images: joi_config_1._arrayString,
    description: joi_config_1.description,
    candidateId: joi_config_1.candidateId,
});
