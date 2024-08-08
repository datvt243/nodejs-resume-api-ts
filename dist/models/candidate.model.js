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
    /* _id: ObjectId, */
    _id: { type: ObjectId, required: [false, 'Vui lòng nhập ID ứng viên'] },
    email: { type: String, default: '', required: [false, 'Vui lòng nhập email'] },
    password: { type: String, default: '', required: [false, 'Vui lòng nhập email'] },
    /* họ và tên */
    firstName: { type: String, default: '', required: [false, 'Vui lòng nhập họ'] },
    lastName: { type: String, default: '', required: [false, 'Vui lòng nhập tên'] },
    gender: { type: Boolean, default: 0, required: [false, 'Vui lòng nhập giới tính'] },
    marital: { type: Boolean, default: 0, required: [false, 'Vui lòng nhập tình trạng hôn nhân'] },
    birthday: { type: Number, default: 0, min: 0, required: [false, 'Vui lòng nhập ngày sinh'] },
    address: { type: String, default: '' },
    phone: { type: String, default: '', required: [false, 'Vui lòng nhập số điện thoại'] },
    introduction: { type: String, default: '', required: [false, 'Vui lòng nhập giới thiệu bản thân'] },
    socialMedia: {
        github: { type: String, required: false },
        linkedin: { type: String, required: false },
        website: { type: String, required: false },
    },
}, { timestamps: true });
const Candidate = mongoose_1.default.model('candidate', schema);
exports.default = Candidate;
