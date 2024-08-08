"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataUserIdFromToken = exports._log = void 0;
__exportStar(require("./bcrypt"), exports);
__exportStar(require("./helper"), exports);
__exportStar(require("./jwt"), exports);
__exportStar(require("./valid"), exports);
const jwt_1 = require("./jwt");
const process_config_1 = require("@/config/process.config");
const _log = (props) => {
    /*
    console.warn(): In ra cảnh báo.
    console.error(): In ra lỗi.
    console.table(): In ra bảng dữ liệu.
    console.time() và console.timeEnd(): Đo thời gian thực hiện của một đoạn mã.
    */
    if (!props)
        return;
    if (typeof props === 'string')
        return console.log(props);
    if (Array.isArray(props)) {
        console.group();
        props.forEach((el) => {
            console.log({ el });
        });
        console.groupEnd();
        return;
    }
    const obj = {
        warn: (t) => console.warn(t),
        error: (t) => console.error(t),
        table: (t) => console.table(t),
    };
    const { text = '', type = 'warn' } = props;
    return Object.keys(obj).includes(type) ? obj?.[type]?.(text) : console.log(text);
};
exports._log = _log;
const getDataUserIdFromToken = (req) => {
    let success = false, _id = null;
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token)
        return { success: false, _id: '' };
    try {
        const { _id: id } = (0, jwt_1.jwtVerify)(token, process_config_1.TOKEN_SECRET);
        _id = id;
        success = true;
    }
    catch (err) {
        success = false;
    }
    return {
        success,
        _id,
    };
};
exports.getDataUserIdFromToken = getDataUserIdFromToken;
