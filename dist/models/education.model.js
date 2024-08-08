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
    school: { type: String, default: '', required: [false, 'Vui lòng nhập Tên trường'] },
    major: { type: String, default: '', required: [false, 'Vui lòng nhập ngành học'] },
    startDate: { type: Number, default: '', required: [false, 'Vui lòng nhập ngày bắt đầu'] },
    endDate: { type: Number, default: '', required: [false, 'Vui lòng nhập ngày kết thúc'] },
    description: { type: String, default: '', required: [false, 'Vui lòng nhập mô tả'] },
    isCurrent: { type: Boolean, default: false },
    candidateId: { type: ObjectId, required: [true, 'Vui lòng nhập ID ứng viên'], ref: 'candidate' },
}, { timestamps: true });
const Education = mongoose_1.default.model('education', schema);
exports.default = Education;