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
    _id: ObjectId,
    name: { type: String, default: '', required: [false, 'Vui lòng nhập tên chứng chỉ'] },
    organization: { type: String, default: '', required: [false, 'Vui lòng nhập tên tổ chức'] },
    issueDate: { type: Number, default: '', required: [false, 'Vui lòng nhập ngày bắt đầu'] },
    link: { type: String, default: '', required: [false, 'Vui lòng nhập liên kết'] },
    images: { type: Array, of: String },
    description: { type: String, default: '', required: [false, 'Vui lòng nhập mô tả'] },
    candidateId: { type: ObjectId, required: [true, 'Vui lòng nhập ID ứng viên'], ref: 'candidate' },
}, { timestamps: true });
const Award = mongoose_1.default.model('award', schema);
exports.default = Award;
