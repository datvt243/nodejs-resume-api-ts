/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const schema = new Schema(
    {
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
    },
    { timestamps: true },
);

const Project = mongoose.model('project', schema);

export default Project;
