/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

import { foreignLanguageSchema, professionalSkillsSchema, personalSkills } from '@/models/part';

const schema = new Schema(
    {
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
        personalSkills: { type: [personalSkills], default: [] },
        professionalSkills: { type: [professionalSkillsSchema], default: [] },
        professionalSkillsGroup: { type: Array, of: String, default: [], required: [false, 'Vui lòng nhập nhóm'] },
        foreignLanguages: {
            type: [foreignLanguageSchema],
            default: [],
            required: [false, 'Vui lòng nhập ngoại ngữ'],
        },
    },
    { timestamps: true },
);

const generalInformation = mongoose.model('general-information', schema);

export default generalInformation;
