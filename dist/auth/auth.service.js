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
exports.handlerLogin = exports.handlerRegister = exports.isEmailAlreadyExists = void 0;
const candidate_model_1 = __importDefault(require("@/models/candidate.model"));
const utils_1 = require("@/utils");
const process_config_1 = require("@/config/process.config");
const isEmailAlreadyExists = async (email) => {
    const find = await candidate_model_1.default.findOne({ email });
    return !!find;
};
exports.isEmailAlreadyExists = isEmailAlreadyExists;
const handlerRegister = async (item) => {
    /**
     * FLOW
     *  1. lấy thông tin input [email, pwd, re-pwd]
     *  2. validate thông tin
     *      2.1. 'false' -> return error
     *  3. mã hoá pwd
     *  4. lưu thông tin
     */
    const { email, password } = item;
    /**
     * check Email đã tồn tại chưa
     */
    const emailHasExits = await (0, exports.isEmailAlreadyExists)(email);
    if (emailHasExits)
        return { success: false, message: 'Email đã tồn tại' };
    /**
     * TODO: validate data với mongo model.valid
     */
    const bcryptPwd = (0, utils_1.bcryptGenerateSalt)(password);
    const document = await candidate_model_1.default.create({
        _id: null,
        email: email,
        password: bcryptPwd,
    });
    return { success: true, message: 'Đăng ký thành công' };
};
exports.handlerRegister = handlerRegister;
const handlerLogin = async (data) => {
    /**
     * FLOW
     * 1. find user by email
     * 2. check
     *      2.1. ko tìm thấy return error
     *      2.2. tìm thấy -> lấy ra pwd (đã đc hash)
     * 3. compare pwd (input) và pwd (hash)
     *      3.1. 'false' -> return error
     *      3.2. 'true' -> return [token, user]
     */
    const { email, password } = data;
    const _user = await candidate_model_1.default.findOne({ email });
    if (!_user)
        return { success: false, message: 'Email không tồn tại' };
    /**
     * so sánh Pwd với pwd trong database
     */
    const { _id, password: pwdHash } = _user;
    const comparePwd = await (0, utils_1.bcryptCompareHash)(password, pwdHash);
    if (!comparePwd)
        return { success: false, message: 'Mật khẩu không chính xác' };
    /**
     * init token
     */
    const token = (0, utils_1.jwtSign)({ _id }, process_config_1.TOKEN_SECRET);
    const tokenRefresh = (0, utils_1.jwtSign)({ _id }, process_config_1.TOKEN_REFRESH);
    return {
        success: true,
        message: 'Đăng nhập thành công',
        data: {
            user: {
                email: _user.email,
                first_name: _user.firstName || '',
                last_name: _user.lastName || '',
            },
            token: token,
            tokenRefresh: tokenRefresh,
        },
        errors: null,
    };
};
exports.handlerLogin = handlerLogin;
