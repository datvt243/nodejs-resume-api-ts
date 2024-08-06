/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import Joi from 'joi';
import { _id, candidateId, startDate, endDate, description, _stringDefault, _arrayString, _boolean } from '@/config/joi.config';

export const schemaProject = Joi.object({
    _id,
    name: _stringDefault({ min: 0, max: 50, title: 'Project' }),
    description,
    position: _stringDefault({ min: 0, max: 100, title: 'Vị trí' }),
    technology: _arrayString,
    companyId: Joi.string().trim().strict(),
    images: _arrayString,
    link: _stringDefault({ min: 0, max: 100, title: 'Liên kết' }),
    isWorking: _boolean,
    startDate,
    endDate,
    candidateId,
});
