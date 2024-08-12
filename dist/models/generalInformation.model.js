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
const part_1 = require("@/models/part");
const schema = new Schema({
    candidateId: { type: ObjectId, required: [true, 'Vui lòng nhập ID ứng viên'], ref: 'candidate' },
    /* vị trí mong muốn */
    positionDesired: { type: String, default: '', required: [false, 'Vui lòng nhập vị trí mong muốn'] },
    career: { type: String, default: '', required: [false, 'Vui lòng nhập nghề nghiệp'] },
    levelCurrent: { type: String, default: '', required: [false, 'Vui lòng nhập cấp bậc hiện tại'] },
    levelDesired: { type: String, default: '', required: [false, 'Vui lòng nhập cấp bậc mong muốn'] },
    salaryDesired: { type: Number, default: '', required: [false, 'Vui lòng nhập mức lương mong muốn'] },
    education: { type: String, default: '', required: [false, 'Vui lòng học vấn'] },
    yearsOfExperience: { type: Number, default: 0, required: [false, 'Vui lòng nhập số năm kinh nghiệm'] },
    workLocation: { type: String, default: '', required: [false, 'Vui lòng nhập địa điểm làm việc'] },
    workForm: { type: String, default: '', required: [false, 'Vui lòng nhập hình thức làm việc'] },
    careerGoal: { type: String, default: '', required: [false, 'Vui lòng nhập mục tiêu công việc'] },
    personalSkills: { type: [part_1.personalSkills], default: [] },
    professionalSkills: { type: [part_1.professionalSkillsSchema], default: [] },
    professionalSkillsGroup: { type: Array, of: String, default: [], required: [false, 'Vui lòng nhập nhóm'] },
    foreignLanguages: {
        type: [part_1.foreignLanguageSchema],
        default: [],
        required: [false, 'Vui lòng nhập ngoại ngữ'],
    },
}, { timestamps: true });
const generalInformation = mongoose_1.default.model('general-information', schema);
exports.default = generalInformation;
