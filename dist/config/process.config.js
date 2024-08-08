"use strict";
/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKEN_EXP_IN = exports.TOKEN_REFRESH = exports.TOKEN_SECRET = exports.SESSION_SECRET = exports.MONGOBD_PASSWORD = exports.MONGOBD_USER = exports.LOCAL_PORT = exports.NODE_ENV = void 0;
require("dotenv/config");
const ENV_KEYS = [
    'NODE_ENV',
    'LOCAL_PORT',
    'MONGOBD_USER',
    'MONGOBD_PASSWORD',
    'SESSION_SECRET',
    'TOKEN_SECRET',
    'TOKEN_REFRESH',
    'TOKEN_EXP_IN',
];
const result = {};
for (const k of ENV_KEYS) {
    result[k] = process.env?.[k];
}
const { NODE_ENV, LOCAL_PORT, MONGOBD_USER, MONGOBD_PASSWORD, SESSION_SECRET, TOKEN_SECRET, TOKEN_REFRESH, TOKEN_EXP_IN } = process.env;
exports.NODE_ENV = NODE_ENV;
exports.LOCAL_PORT = LOCAL_PORT;
exports.MONGOBD_USER = MONGOBD_USER;
exports.MONGOBD_PASSWORD = MONGOBD_PASSWORD;
exports.SESSION_SECRET = SESSION_SECRET;
exports.TOKEN_SECRET = TOKEN_SECRET;
exports.TOKEN_REFRESH = TOKEN_REFRESH;
exports.TOKEN_EXP_IN = TOKEN_EXP_IN;
