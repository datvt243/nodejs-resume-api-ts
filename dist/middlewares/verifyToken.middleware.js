"use strict";
// comming soon
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTokenByQuery = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_status_codes_1 = require("http-status-codes");
const process_config_1 = require("@/config/process.config");
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: 'Access denied. No token provided.',
            invalidToken: true,
        });
    }
    verify(token, req, res, next);
};
exports.verifyToken = verifyToken;
const verifyTokenByQuery = (req, res, next) => {
    const { token } = req.query;
    if (!token) {
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: 'Access denied. No token provided.',
            invalidToken: true,
        });
    }
    verify(token, req, res, next);
};
exports.verifyTokenByQuery = verifyTokenByQuery;
function verify(token, req, res, next) {
    try {
        const decoded = process_config_1.TOKEN_SECRET ? jsonwebtoken_1.default.verify(token, process_config_1.TOKEN_SECRET) : { _id: null };
        const { _id } = decoded;
        /**
         * thêm candidateId vào body
         */
        req.body.candidateId = _id;
        /** next */
        next();
        /**  */
    }
    catch (err) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ success: false, message: 'Invalid token.', invalidToken: true });
    }
}
