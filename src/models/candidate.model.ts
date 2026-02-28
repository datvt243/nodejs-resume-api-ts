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
    _id: { type: ObjectId, required: false },
    email: { type: String, default: '', required: [true, 'Email is required'] },
    password: { type: String, default: '', required: [true, 'Password is required'] },

    /* họ và tên */
    firstName: { type: String, default: '', required: false },
    lastName: { type: String, default: '', required: false },

    gender: { type: Boolean, default: 0, required: false },
    marital: { type: Boolean, default: 0, required: false },
    birthday: { type: Number, default: 0, min: 0, required: false },
    address: { type: String, default: '' },

    phone: { type: String, default: '', required: false },
    introduction: { type: String, default: '', required: false },
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
