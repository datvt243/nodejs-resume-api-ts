"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorsMiddleware = void 0;
const http_status_codes_1 = require("http-status-codes");
const process_config_1 = require("@/config/process.config");
const utils_1 = require("@/utils");
const errorsMiddleware = (err, req, res, next) => {
    (0, utils_1._log)('***** WARNING!!! Ops! we got a problem');
    let _message = '', _code = http_status_codes_1.StatusCodes.BAD_REQUEST;
    if (err instanceof ReferenceError) {
        _message = err.message;
    }
    else {
        _message = 'Lỗi không xác định';
        _code = 404;
    }
    res.status(_code || 404).json({
        message: _message,
        stack: process_config_1.NODE_ENV === 'development' ? err.stack : null,
    });
};
exports.errorsMiddleware = errorsMiddleware;
