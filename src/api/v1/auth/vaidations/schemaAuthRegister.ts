/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import Joi from "joi";
import { JoiSchemaTypesConst, renderJoi } from "@/plugins/joi";

export const schemaAuthRegister = Joi.object({
    email: renderJoi(JoiSchemaTypesConst.EMAIL, { 
      required: { value: true, message: '' } 
    }),
    password: renderJoi(JoiSchemaTypesConst.PWD),
    repassword: Joi.any().valid(Joi.ref('password')).required().messages({
        'any.only': 'Password không khớp',
    }),
}).with('password', 'repassword');

