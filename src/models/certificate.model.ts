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
        name: { type: String, default: '', required: [false, 'Vui lòng nhập tên chứng chỉ'] },
        organization: { type: String, default: '', required: [false, 'Vui lòng nhập tên tổ chức'] },
        description: { type: String, default: '', required: [false, 'Vui lòng nhập mô tả'] },
        startDate: { type: Number, default: '', required: [false, 'Vui lòng nhập ngày bắt đầu'] },
        endDate: { type: Number, default: '', required: [false, 'Vui lòng nhập ngày kết thúc'] },
        isNoExpiration: { type: Boolean, default: false },
        link: { type: String, default: '', required: [false, 'Vui lòng nhập liên kết'] },
        images: { type: Array, of: String },
        candidateId: { type: ObjectId, required: [true, 'Vui lòng nhập ID ứng viên'], ref: 'candidate' },
    },
    { timestamps: true },
);

const Certificate = mongoose.model('certificate', schema);

export default Certificate;
