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
    },
    { timestamps: true },
);

const Candidate = mongoose.model('candidate', schema);

export default Candidate;
