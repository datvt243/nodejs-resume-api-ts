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
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const ObjectId = mongoose_1.default.Schema.Types.ObjectId;
const schema = new Schema({
    fullName: { type: String, default: '', required: [false, 'Vui lòng nhập Họ tên'] },
    phone: { type: String, default: '', required: [false, 'Vui lòng nhập Số điện thoại'] },
    company: { type: String, default: '', required: [false, 'Vui lòng nhập Công ty'] },
    position: { type: String, default: '', required: [false, 'Vui lòng nhập Vị trí công việc'] },
    candidateId: { type: ObjectId, required: [true, 'Vui lòng nhập ID ứng viên'], ref: 'candidate' },
}, { timestamps: true });
const Reference = mongoose_1.default.model('reference', schema);
exports.default = Reference;
