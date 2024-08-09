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
exports.socialMediaSchema = exports.personalSkills = exports.professionalSkillsSchema = exports.foreignLanguageSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 *
 */
const Schema = mongoose_1.default.Schema;
const ObjectId = Schema.ObjectId;
/**
 * ---------------------------
 */
exports.foreignLanguageSchema = new Schema({
    language: { type: String, required: true },
    level: { type: String, required: true },
}, { _id: false });
exports.professionalSkillsSchema = new Schema({
    name: { type: String, required: true },
    exp: { type: Number, required: true },
}, { _id: false });
exports.personalSkills = new Schema({
    name: { type: String, required: true },
}, { _id: false });
exports.socialMediaSchema = new Schema({
    name: { type: String, required: true },
    exp: { type: Number, required: true },
}, { _id: false });
