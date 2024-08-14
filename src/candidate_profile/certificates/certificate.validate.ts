/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import Joi from 'joi';
import { _id, _boolean, _arrayString, candidateId, startDate, endDate, _stringDefault, description } from '@/config/joi.config';

export const schemaCertificate = Joi.object({
    _id,
    name: _stringDefault({ min: 0, max: 50, title: 'Chứng chỉ' }),
    organization: _stringDefault({ min: 0, max: 50, title: 'Tổ chức' }),
    description: Joi.string().min(0).trim().strict().label('Mô tả').messages({
        'any.required': `{#label} là bắt buộc`,
        'string.min': `{#label} có ít nhất {#limit} ký tự`,
        'string.max': `{#label} có ít nhất {#limit} ký tự`,
        'string.empty': `{#label} không được trống`,
    }),
    startDate,
    endDate,
    isNoExpiration: _boolean,
    /* link: _stringDefault({ min: 0, max: 100, title: 'Liên kết' }), */
    images: _arrayString,
    candidateId,
});
