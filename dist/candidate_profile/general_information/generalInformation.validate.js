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
exports.schemaGeneralInformation = exports.schemaGeneralInformationPatch = void 0;
const joi_1 = __importDefault(require("joi"));
const joi_config_1 = require("@/config/joi.config");
const _sub = {
    candidateId: joi_config_1.candidateId,
    professionalSkills: joi_1.default.array()
        .items(joi_1.default.object({
        name: joi_1.default.string().required().messages({ 'any.required': 'Tên kỹ năng không được rỗng' }),
        exp: joi_1.default.number().required().messages({ 'any.required': 'Số năm kinh nghiệm không được rỗng' }),
    }).messages({
        'object.base': 'Kỹ năng chuyên môn cần nhập vào là object',
    }))
        .messages({
        'array.base': 'Kỹ năng chuyên môn cần nhập vào là array',
    }),
    personalSkills: joi_1.default.array().items({
        name: joi_1.default.string(),
    }),
    foreignLanguages: joi_config_1.foreignLanguages,
    socialMedia: joi_1.default.object({
        github: joi_1.default.string(),
        linkedin: joi_1.default.string(),
        website: joi_1.default.string(),
    }).messages({
        'object.base': 'Thông tin Social Network cần nhập vào là object',
    }),
};
exports.schemaGeneralInformationPatch = (0, joi_config_1.getObject)({
    _id: joi_config_1._id,
    ..._sub,
});
exports.schemaGeneralInformation = (0, joi_config_1.getObject)({
    _id: joi_config_1._id,
    positionDesired: joi_config_1.position,
    career: (0, joi_config_1._stringDefault)({ min: 3, max: 100, title: 'Nghề nghiệp' }),
    levelCurrent: (0, joi_config_1._stringDefault)({ min: 3, max: 100, title: 'Cấp bậc hiện tại' }),
    levelDesired: (0, joi_config_1._stringDefault)({ min: 3, max: 100, title: 'Cấp bậc mong muốn' }),
    salaryDesired: joi_1.default.number().min(0).required().label('Lương mong muốn').messages({
        'any.required': 'Lương mong muốn không được trống',
        'number.min': `{#label} không được nhỏ hơn {#limit}`,
    }),
    education: (0, joi_config_1._stringDefault)({ min: 3, max: 100, title: 'Học vấn' }),
    workLocation: (0, joi_config_1._stringDefault)({ min: 3, max: 100, title: 'Địa điểm làm việc' }),
    workForm: (0, joi_config_1._stringDefault)({ min: 0, max: 100, title: 'Hình thức làm việc' }),
    careerGoal: (0, joi_config_1._stringDefault)({ min: 0, max: 100, title: 'Mục tiêu nghề nghiệp' }),
    yearsOfExperience: joi_1.default.number().min(0).required().messages({
        'any.required': 'Số năm kinh nghiệm không được rỗng',
        'number.min': `Số năm kinh nghiệm không được nhỏ hơn {#limit}`,
    }),
    ..._sub,
});
