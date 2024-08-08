"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatReturn = exports.resFormatResponse = exports.formatResponse = exports.resBadRequest = exports._throwError = void 0;
const http_status_codes_1 = require("http-status-codes");
const _throwError = (res, message) => {
    res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
    throw new Error(message || 'something wrong bro!!!');
};
exports._throwError = _throwError;
const resBadRequest = (res, error) => {
    let errors = [];
    if (typeof error === 'string') {
        errors.push(error);
    }
    else if (typeof error === 'object') {
        if (Array.isArray(error)) {
            errors = error;
        }
        else {
            const { details = [] } = error;
            errors = details.map((i) => i?.message || '');
        }
    }
    res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
        errors,
        data: null,
    });
};
exports.resBadRequest = resBadRequest;
const formatResponse = (props) => {
    /**
     * Chuẩn data trả về của API
     *  {
     *      success: boolean        // trạng thái
     *      message: string         // mess thành công or thất bại
     *      error: string | array   // danh sách lỗi
     *      data: null | object{ token: string, user: object{ _id, name } } //  data trả về gồm token và thông tin user
     *  }
     */
    const { type = '', success, message, errors = {}, data } = props;
    const getData = (() => {
        if (!success)
            return null;
        if (type === 'register')
            return null;
        if (type === 'login') {
            const { token = '', user = null } = data;
            return { token, user };
        }
        return data;
    })();
    return {
        success,
        message,
        errors,
        data: getData,
    };
};
exports.formatResponse = formatResponse;
const resFormatResponse = (res, status, props) => {
    res.status(status).json((0, exports.formatResponse)(props));
};
exports.resFormatResponse = resFormatResponse;
const formatReturn = (res, props) => {
    const { success = false, message = '', errors = null, data = null, statusCode = null, statusCodeSuccess = 'OK', statusCodeFailed = 'BAD_REQUEST', } = props;
    const _statusCode = (() => {
        if (statusCode)
            return statusCode;
        if (success)
            return http_status_codes_1.StatusCodes['OK'];
        return http_status_codes_1.StatusCodes['BAD_REQUEST'];
    })();
    return res.status(_statusCode).json((0, exports.formatResponse)({
        success,
        message,
        errors,
        data,
    }));
};
exports.formatReturn = formatReturn;
