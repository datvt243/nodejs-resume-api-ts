/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import Joi from "joi";
import { JoiSchemaTypesConst, renderJoi } from "@/plugins/joi";

export const schemaAuthLogin = Joi.object({
    email: renderJoi(JoiSchemaTypesConst.EMAIL, { 
      required: { value: true, message: '' } 
    }),
    password: renderJoi(JoiSchemaTypesConst.PWD)
});
