"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authCreateRefreshToken = exports.authRefreshToken = exports.authLogin = exports.authRegister = void 0;
const http_status_codes_1 = require("http-status-codes");
const utils_1 = require("@/utils");
const auth_validate_1 = require("./auth.validate");
const auth_service_1 = require("./auth.service");
/**
 * Chức năng Đăng ký mới
 */
const authRegister = async (req, res) => {
    /**
     * validate dữ liệu đầu vào
     * { email, password, re-password } = req.body;
     */
    const { isValidated, value = {}, errors, message } = (0, utils_1.validateSchema)({ schema: auth_validate_1.schemaAuthRegister, item: { ...req.body } });
    if (!isValidated) {
        return (0, utils_1.formatReturn)(res, {
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            success: false,
            message,
            errors,
        });
    }
    /**
     * save mới document
     */
    try {
        const { success, message } = await (0, auth_service_1.handlerRegister)({ _id: null, ...value });
        return (0, utils_1.formatReturn)(res, {
            statusCode: http_status_codes_1.StatusCodes[success ? 'OK' : 'UNAUTHORIZED'],
            success: success,
            message: message || 'Đăng ký thành công',
            errors: null,
            data: null,
        });
    }
    catch (err) {
        (0, utils_1._throwError)(res, err);
    }
};
exports.authRegister = authRegister;
/**
 * Chức năng Đăng nhập
 */
const authLogin = async (req, res) => {
    /**
     * validate date come from req
     */
    const { isValidated, value = {}, message, errors } = (0, utils_1.validateSchema)({ schema: auth_validate_1.schemaAuthLogin, item: { ...req.query } });
    if (!isValidated) {
        return (0, utils_1.formatReturn)(res, {
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            success: false,
            message,
            errors,
        });
    }
    /**
     * tiến hành Login
     */
    try {
        const _result = await (0, auth_service_1.handlerLogin)({ email: value.email, password: value.password });
        return (0, utils_1.formatReturn)(res, {
            statusCode: http_status_codes_1.StatusCodes[_result?.success ? 'OK' : 'UNAUTHORIZED'],
            success: _result?.success || false,
            message: _result?.message || 'Login thất bại',
            errors: _result?.errors || [],
            data: _result?.data || null,
        });
    }
    catch (err) {
        (0, utils_1._throwError)(res, err);
    }
};
exports.authLogin = authLogin;
/**
 * Chức năng Refresh token
 */
const authRefreshToken = async (req, res) => {
    // coming soon
};
exports.authRefreshToken = authRefreshToken;
/**
 * Chức năng Tạo mới RefreshToken
 */
const authCreateRefreshToken = async (req, res) => {
    // coming soon
};
exports.authCreateRefreshToken = authCreateRefreshToken;
