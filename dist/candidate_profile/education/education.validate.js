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
exports.schemaEducation = void 0;
const joi_1 = __importDefault(require("joi"));
const joi_config_1 = require("@/config/joi.config");
exports.schemaEducation = joi_1.default.object({
    _id: joi_config_1._id,
    school: joi_1.default.string().min(10).max(255).trim().strict().required().messages({
        'any.required': 'Tên trường là bắt buộc',
        'string.min': 'Tên trường có ít nhất 10 ký tự',
        'string.max': 'Tên trường có nhiều nhất 255 ký tự',
    }),
    major: joi_1.default.string().min(3).max(255).trim().strict().required().messages({
        'any.required': 'Ngành học là bắt buộc',
        'string.min': 'Ngành học có ít nhất 3 ký tự',
        'string.max': 'Ngành học có nhiều nhất 255 ký tự',
    }),
    startDate: joi_config_1.startDate,
    endDate: joi_config_1.endDate,
    isCurrent: joi_config_1._boolean,
    description: joi_1.default.string().min(0).trim().strict().label('Mô tả').messages({
        'any.required': `{#label} là bắt buộc`,
        'string.min': `{#label} có ít nhất {#limit} ký tự`,
        'string.max': `{#label} có ít nhất {#limit} ký tự`,
        'string.empty': `{#label} không được trống`,
    }),
    candidateId: joi_config_1.candidateId,
});
