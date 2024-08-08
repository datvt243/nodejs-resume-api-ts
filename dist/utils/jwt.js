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
exports.jwtVerify = exports.jwtSign = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getSecretKey = () => {
    return 'secretKey';
};
const jwtSign = (data, secretKey, props = { expiresIn: '1h' }) => {
    if (!secretKey) {
        return '';
    }
    const { expiresIn = '1d' } = props;
    const token = jsonwebtoken_1.default.sign(data, secretKey, { expiresIn });
    return token;
};
exports.jwtSign = jwtSign;
const jwtVerify = (token, secretKey) => {
    if (!secretKey)
        return { _id: '' };
    const decoded = jsonwebtoken_1.default.verify(token, secretKey);
    return decoded;
};
exports.jwtVerify = jwtVerify;
