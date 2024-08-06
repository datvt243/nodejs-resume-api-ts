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
        school: { type: String, default: '', required: [false, 'Vui lòng nhập Tên trường'] },
        major: { type: String, default: '', required: [false, 'Vui lòng nhập ngành học'] },
        startDate: { type: Number, default: '', required: [false, 'Vui lòng nhập ngày bắt đầu'] },
        endDate: { type: Number, default: '', required: [false, 'Vui lòng nhập ngày kết thúc'] },
        description: { type: String, default: '', required: [false, 'Vui lòng nhập mô tả'] },
        isCurrent: { type: Boolean, default: false },
        candidateId: { type: ObjectId, required: [true, 'Vui lòng nhập ID ứng viên'], ref: 'candidate' },
    },
    { timestamps: true },
);

const Education = mongoose.model('education', schema);

export default Education;
