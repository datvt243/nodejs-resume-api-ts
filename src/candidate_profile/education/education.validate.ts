/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import Joi from 'joi';
import { _id, _boolean, candidateId, startDate, endDate, description } from '@/config/joi.config';

export const schemaEducation = Joi.object({
    _id,
    school: Joi.string().min(10).max(255).trim().strict().required().messages({
        'any.required': 'Tên trường là bắt buộc',
        'string.min': 'Tên trường có ít nhất 10 ký tự',
        'string.max': 'Tên trường có nhiều nhất 255 ký tự',
    }),
    major: Joi.string().min(3).max(255).trim().strict().required().messages({
        'any.required': 'Ngành học là bắt buộc',
        'string.min': 'Ngành học có ít nhất 3 ký tự',
        'string.max': 'Ngành học có nhiều nhất 255 ký tự',
    }),
    startDate,
    endDate,
    isCurrent: _boolean,
    description: description,
    candidateId,
});
