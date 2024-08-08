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
exports.schemaCandidate = exports.schemaCandidatePatch = void 0;
const joi_1 = __importDefault(require("joi"));
const joi_config_1 = require("@/config/joi.config");
exports.schemaCandidatePatch = (0, joi_config_1.getObject)({
    _id: joi_config_1._id,
    candidateId: joi_config_1.candidateId,
    socialMedia: joi_1.default.object({
        github: joi_1.default.string(),
        linkedin: joi_1.default.string(),
        website: joi_1.default.string(),
    }),
});
exports.schemaCandidate = (0, joi_config_1.getObject)({
    _id: joi_config_1._id,
    firstName: joi_config_1.firstName,
    lastName: joi_config_1.lastName,
    phone: joi_config_1.phone,
    marital: joi_1.default.boolean().required().messages({
        'any.required': 'Tình trạng hôn nhân không được rỗng',
    }),
    gender: joi_1.default.boolean().required().messages({
        'any.required': 'Giới tính không được rỗng',
    }),
    birthday: joi_1.default.number().min(0).required().messages({
        'any.required': 'Ngày sinh không được rỗng',
    }),
    address: joi_1.default.string().min(0).max(255).required().messages({
        'any.required': 'Địa chỉ không được rỗng',
    }),
    introduction: joi_1.default.string().required().messages({
        'any.required': 'Giới thiệu bản thân không được rỗng',
    }),
    socialMedia: joi_1.default.object({
        github: joi_1.default.string(),
        linkedin: joi_1.default.string(),
        website: joi_1.default.string(),
    }),
    candidateId: joi_config_1.candidateId,
});
// personal information: thông tin cá nhân
// general information: thông tin chung
