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
exports.schemaReference = void 0;
const joi_1 = __importDefault(require("joi"));
const joi_config_1 = require("@/config/joi.config");
exports.schemaReference = joi_1.default.object({
    _id: joi_config_1._id,
    fullName: joi_config_1.fullName,
    phone: joi_config_1.phone,
    company: joi_config_1.company,
    position: joi_config_1.position,
    candidateId: joi_config_1.candidateId,
});
