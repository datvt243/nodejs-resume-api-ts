/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import Joi from 'joi';
import { email, password } from '@/config/joi.config';

export const schemaAuthRegister = Joi.object({
    email,
    password,
    repassword: Joi.any().valid(Joi.ref('password')).required().messages({
        'any.only': 'Password không khớp',
    }),
}).with('password', 'repassword');

export const schemaAuthLogin = Joi.object({
    email,
    password,
});
