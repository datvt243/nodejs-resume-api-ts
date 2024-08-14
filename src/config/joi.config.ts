/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import Joi from 'joi';
import { phoneRegex } from '@/config/regex.config';

interface JoiProps {
    type?: string;
    min?: number;
    max?: number;
    required?: boolean;
    label?: string;
    pattern?: string;
    title?: string;
}
type JoiMessages = Record<string, any>;

// Định nghĩa một custom validator cho ObjectId của MongoDB
const objectIdValidator = Joi.extend((joi) => ({
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

export const settingJoiValidate = (props: JoiProps) => {
    const { type = 'string', min = null, max = null, required = false, label = '', pattern = '' } = props;

    const _messages: JoiMessages = {};
    const _joi: any = Joi;

    if (type) {
        if (type === 'string') _joi.string();
        if (type === 'number') _joi.number();
        if (type === 'boolean') _joi.boolean();
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

export const _id = objectIdValidator.objectId().required();

export const candidateId = Joi.string();

export const getObject = (fields: Record<string, any>) => {
    return Joi.object(fields);
};

export const email = Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'vn'] } })
    .trim()
    .strict()
    .required()
    .messages({
        'any.required': 'Email là bắt buộc',
        'string.empty': 'Email không được rỗng',
        'string.email': 'Email không đúng định dạng',
    });
export const password = Joi.string().min(5).trim().strict().required().messages({
    'any.required': 'Password là bắt buộc',
    'string.empty': 'Password không được rỗng',
});

export const firstName = Joi.string().min(1).max(15).trim().strict().required().messages({
    'any.required': 'Họ là bắt buộc',
    'string.min': 'Họ có ít nhất {#limit} ký tự',
    'string.max': 'Họ có ít nhất {#limit} ký tự',
    'string.empty': 'Họ không được trống',
});

export const lastName = Joi.string().min(3).max(35).trim().strict().required().messages({
    'any.required': 'Tên là bắt buộc',
    'string.min': 'Tên có ít nhất {#limit} ký tự',
    'string.max': 'Tên có ít nhất {#limit} ký tự',
    'string.empty': 'Tên không được trống',
});

export const fullName = Joi.string().min(3).max(50).trim().strict().required().messages({
    'any.required': 'Họ tên là bắt buộc',
    'string.min': 'Họ tên có ít nhất {#limit} ký tự',
    'string.max': 'Họ tên có ít nhất {#limit} ký tự',
    'string.empty': 'Họ tên không được trống',
});

export const company = Joi.string().min(0).max(100).trim().strict().required().messages({
    'any.required': 'Tên công ty là bắt buộc',
    'string.min': 'Tên công ty có ít nhất {#limit} ký tự',
    'string.max': 'Tên công ty có ít nhất {#limit} ký tự',
    'string.empty': 'Tên công ty tên không được trống',
});

export const position = Joi.string().min(0).max(100).trim().strict().required().messages({
    'any.required': 'Vị trí là bắt buộc',
    'string.min': 'Vị trí ty có ít nhất {#limit} ký tự',
    'string.max': 'Vị trí ty có ít nhất {#limit} ký tự',
    'string.empty': 'Vị trí ty tên không được trống',
});

export const phone = Joi.string().pattern(phoneRegex).trim().strict().required().messages({
    'any.required': 'Số điện thoại là bắt buộc',
    'string.pattern.base': 'Số điện thoại {#value} không hợp lệ. Số điện thoại phải có 10-11 chữ số',
    'string.empty': 'Số điện thoại không được để trống',
});

export const introduction = Joi.string().required().messages({
    'any.required': 'Giới thiệu bản thân không được rỗng',
});

export const startDate = Joi.number().required().messages({
    'any.required': 'Ngày bắt đầu là bắt buộc',
    'number.empty': 'Ngày bắt đầu không được trống',
});
export const endDate = Joi.number().greater(Joi.ref('startDate')).messages({
    'number.greater': 'Ngày kết thúc phải lớn hơn ngày bắt đầu',
});

export const _boolean = Joi.boolean();
export const _arrayString = Joi.array().items(Joi.string());

export const foreignLanguages = Joi.array().items({
    language: Joi.string(),
    level: Joi.string(),
});

export const description = Joi.string().min(0).trim().strict().required().label('Mô tả').messages({
    'any.required': `{#label} là bắt buộc`,
    'string.min': `{#label} có ít nhất {#limit} ký tự`,
    'string.max': `{#label} có ít nhất {#limit} ký tự`,
    'string.empty': `{#label} không được trống`,
});

export const _stringDefault = (props: JoiProps) => {
    const { min = 3, max = 100, title = 'Title' } = props;
    return Joi.string().min(min).max(max).trim().strict().required().label(title).messages({
        'any.required': `{#label} là bắt buộc`,
        'string.min': `{#label} có ít nhất {#limit} ký tự`,
        'string.max': `{#label} có ít nhất {#limit} ký tự`,
        'string.empty': `{#label} không được trống`,
    });
};
