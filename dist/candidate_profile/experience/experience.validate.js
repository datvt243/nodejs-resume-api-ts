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
exports.schemaExperience = void 0;
const joi_1 = __importDefault(require("joi"));
const joi_config_1 = require("@/config/joi.config");
exports.schemaExperience = joi_1.default.object({
    _id: joi_config_1._id,
    company: joi_config_1.company,
    position: joi_config_1.position,
    startDate: joi_config_1.startDate,
    endDate: joi_config_1.endDate,
    isCurrent: joi_config_1._boolean,
    description: joi_config_1.description,
    candidateId: joi_config_1.candidateId,
    skills: joi_config_1._arrayString,
});
