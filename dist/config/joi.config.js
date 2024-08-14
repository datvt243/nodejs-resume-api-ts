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
exports._stringDefault = exports.description = exports.foreignLanguages = exports._arrayString = exports._boolean = exports.endDate = exports.startDate = exports.introduction = exports.phone = exports.position = exports.company = exports.fullName = exports.lastName = exports.firstName = exports.password = exports.email = exports.getObject = exports.candidateId = exports._id = exports.settingJoiValidate = void 0;
const joi_1 = __importDefault(require("joi"));
const regex_config_1 = require("@/config/regex.config");
// Định nghĩa một custom validator cho ObjectId của MongoDB
const objectIdValidator = joi_1.default.extend((joi) => ({
    type: 'objectId',
    base: joi
        .string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .allow(null)
        .required(),
    messages: {
        'objectId.base': '{{#label}} must be a valid ObjectId',
    },
}));
const settingJoiValidate = (props) => {
    const { type = 'string', min = null, max = null, required = false, label = '', pattern = '' } = props;
    const _messages = {};
    const _joi = joi_1.default;
    if (type) {
        if (type === 'string')
            _joi.string();
        if (type === 'number')
            _joi.number();
        if (type === 'boolean')
            _joi.boolean();
        _messages[`${type}.empty`] = 'Họ tên không được trống';
    }
    if (pattern) {
        _joi.pattern(pattern);
    }
    if (min !== null) {
        _joi.min(min);
        _messages[`${type}.min`] =
            type === 'string' ? '{#label} có ít nhất {#limit} ký tự' : '{#label} không được nhỏ hơn {#limit}';
    }
    if (max !== null) {
        _joi.max(max);
        _messages[`${type}.max`] =
            type === 'string' ? '{#label} có nhiều nhất {#limit} ký tự' : '{#label} không được lớn hơn {#limit}';
    }
    if (required) {
        _joi.required();
        _messages[`any.required`] = `{#label} là bắt buộc`;
    }
    _joi.trim().strict();
    if (label) {
        _joi.label(label);
    }
    _joi.messages(_messages);
    return _joi;
};
exports.settingJoiValidate = settingJoiValidate;
exports._id = objectIdValidator.objectId().required();
exports.candidateId = joi_1.default.string();
const getObject = (fields) => {
    return joi_1.default.object(fields);
};
exports.getObject = getObject;
exports.email = joi_1.default.string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'vn'] } })
    .trim()
    .strict()
    .required()
    .messages({
    'any.required': 'Email là bắt buộc',
    'string.empty': 'Email không được rỗng',
    'string.email': 'Email không đúng định dạng',
});
exports.password = joi_1.default.string().min(5).trim().strict().required().messages({
    'any.required': 'Password là bắt buộc',
    'string.empty': 'Password không được rỗng',
});
exports.firstName = joi_1.default.string().min(1).max(15).trim().strict().required().messages({
    'any.required': 'Họ là bắt buộc',
    'string.min': 'Họ có ít nhất {#limit} ký tự',
    'string.max': 'Họ có ít nhất {#limit} ký tự',
    'string.empty': 'Họ không được trống',
});
exports.lastName = joi_1.default.string().min(3).max(35).trim().strict().required().messages({
    'any.required': 'Tên là bắt buộc',
    'string.min': 'Tên có ít nhất {#limit} ký tự',
    'string.max': 'Tên có ít nhất {#limit} ký tự',
    'string.empty': 'Tên không được trống',
});
exports.fullName = joi_1.default.string().min(3).max(50).trim().strict().required().messages({
    'any.required': 'Họ tên là bắt buộc',
    'string.min': 'Họ tên có ít nhất {#limit} ký tự',
    'string.max': 'Họ tên có ít nhất {#limit} ký tự',
    'string.empty': 'Họ tên không được trống',
});
exports.company = joi_1.default.string().min(0).max(100).trim().strict().required().messages({
    'any.required': 'Tên công ty là bắt buộc',
    'string.min': 'Tên công ty có ít nhất {#limit} ký tự',
    'string.max': 'Tên công ty có ít nhất {#limit} ký tự',
    'string.empty': 'Tên công ty tên không được trống',
});
exports.position = joi_1.default.string().min(0).max(100).trim().strict().required().messages({
    'any.required': 'Vị trí là bắt buộc',
    'string.min': 'Vị trí ty có ít nhất {#limit} ký tự',
    'string.max': 'Vị trí ty có ít nhất {#limit} ký tự',
    'string.empty': 'Vị trí ty tên không được trống',
});
exports.phone = joi_1.default.string().pattern(regex_config_1.phoneRegex).trim().strict().required().messages({
    'any.required': 'Số điện thoại là bắt buộc',
    'string.pattern.base': 'Số điện thoại {#value} không hợp lệ. Số điện thoại phải có 10-11 chữ số',
    'string.empty': 'Số điện thoại không được để trống',
});
exports.introduction = joi_1.default.string().required().messages({
    'any.required': 'Giới thiệu bản thân không được rỗng',
});
exports.startDate = joi_1.default.number().required().messages({
    'any.required': 'Ngày bắt đầu là bắt buộc',
    'number.empty': 'Ngày bắt đầu không được trống',
});
exports.endDate = joi_1.default.number().greater(joi_1.default.ref('startDate')).messages({
    'number.greater': 'Ngày kết thúc phải lớn hơn ngày bắt đầu',
});
exports._boolean = joi_1.default.boolean();
exports._arrayString = joi_1.default.array().items(joi_1.default.string());
exports.foreignLanguages = joi_1.default.array().items({
    language: joi_1.default.string(),
    level: joi_1.default.string(),
});
exports.description = joi_1.default.string().min(0).trim().strict().required().label('Mô tả').messages({
    'any.required': `{#label} là bắt buộc`,
    'string.min': `{#label} có ít nhất {#limit} ký tự`,
    'string.max': `{#label} có ít nhất {#limit} ký tự`,
    'string.empty': `{#label} không được trống`,
});
const _stringDefault = (props) => {
    const { min = 3, max = 100, title = 'Title' } = props;
    return joi_1.default.string().min(min).max(max).trim().strict().required().label(title).messages({
        'any.required': `{#label} là bắt buộc`,
        'string.min': `{#label} có ít nhất {#limit} ký tự`,
        'string.max': `{#label} có ít nhất {#limit} ký tự`,
        'string.empty': `{#label} không được trống`,
    });
};
exports._stringDefault = _stringDefault;
