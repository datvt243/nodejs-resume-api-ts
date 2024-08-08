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
exports.schemaAuthLogin = exports.schemaAuthRegister = void 0;
const joi_1 = __importDefault(require("joi"));
const joi_config_1 = require("@/config/joi.config");
exports.schemaAuthRegister = joi_1.default.object({
    email: joi_config_1.email,
    password: joi_config_1.password,
    repassword: joi_1.default.any().valid(joi_1.default.ref('password')).required().messages({
        'any.only': 'Password không khớp',
    }),
}).with('password', 'repassword');
exports.schemaAuthLogin = joi_1.default.object({
    email: joi_config_1.email,
    password: joi_config_1.password,
});
