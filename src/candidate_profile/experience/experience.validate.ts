/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import Joi from 'joi';
import {
    _id,
    _boolean,
    _arrayString,
    company,
    position,
    candidateId,
    startDate,
    endDate,
    description,
} from '@/config/joi.config';

export const schemaExperience = Joi.object({
    _id,
    company,
    position,
    startDate,
    endDate,
    isCurrent: _boolean,
    description: description,
    candidateId,
    skills: _arrayString,
});
