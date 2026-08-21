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
    group: { type: String, required: false },
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

// Free-text content (introduction/description-style fields) stored per
// language. Proper-noun/label fields (school, company, position title,
// etc.) stay plain String — only fields a candidate actually writes
// prose into get this treatment.
export const localizedTextSchema = new Schema(
  {
    vi: { type: String, default: '' },
    en: { type: String, default: '' },
  },
  { _id: false },
);
