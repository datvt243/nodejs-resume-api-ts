"use strict";
/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.phoneRegex = exports.passwordRegex = void 0;
exports.passwordRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+{}|;:,./<>?])[a-zA-Z0-9!@#$%^&*()_+{}|;:,./<>?]{5,}$');
exports.phoneRegex = new RegExp('^[0-9]{10,11}$');
