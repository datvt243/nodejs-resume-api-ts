"use strict";
/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionConfig = void 0;
const process_config_1 = require("@/config/process.config");
const sessionConfig = () => {
    return {
        secret: process_config_1.SESSION_SECRET || '',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: true },
    };
};
exports.sessionConfig = sessionConfig;
