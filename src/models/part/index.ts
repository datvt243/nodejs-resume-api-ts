/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import mongoose from 'mongoose';

/**
 *
 */
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

/**
 * ---------------------------
 */

export const foreignLanguageSchema = new Schema(
    {
        language: { type: String, required: true },
        level: { type: String, required: true },
    },
    { _id: false },
);
export const professionalSkillsSchema = new Schema(
    {
        name: { type: String, required: true },
        exp: { type: Number, required: true },
    },
    { _id: false },
);
export const personalSkills = new Schema(
    {
        name: { type: String, required: true },
    },
    { _id: false },
);
export const socialMediaSchema = new Schema(
    {
        name: { type: String, required: true },
        exp: { type: Number, required: true },
    },
    { _id: false },
);
