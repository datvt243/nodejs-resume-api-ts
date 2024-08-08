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
    name: { type: String, default: '', required: [false, 'Vui lòng nhập tên dự án'] },
    description: { type: String, default: '', required: [false, 'Vui lòng nhập mô tả'] },
    position: { type: String, default: '', required: [false, 'Vui lòng nhập vị trí công việc'] },
    technology: { type: Array, of: String },
    companyId: ObjectId,
    images: { type: Array, of: String },
    link: { type: String, default: '', required: [false, 'Vui lòng nhập liên kết'] },
    isWorking: { type: Boolean, default: false },
    startDate: { type: Number, default: '', required: [false, 'Vui lòng nhập ngày bắt đầu'] },
    endDate: { type: Number, default: '', required: [false, 'Vui lòng nhập ngày kết thúc'] },
    candidateId: { type: ObjectId, required: [true, 'Vui lòng nhập ID ứng viên'], ref: 'candidate' },
}, { timestamps: true });
const Project = mongoose_1.default.model('project', schema);
exports.default = Project;
