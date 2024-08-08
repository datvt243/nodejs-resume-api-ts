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
exports.schemaProject = void 0;
const joi_1 = __importDefault(require("joi"));
const joi_config_1 = require("@/config/joi.config");
exports.schemaProject = joi_1.default.object({
    _id: joi_config_1._id,
    name: (0, joi_config_1._stringDefault)({ min: 0, max: 50, title: 'Project' }),
    description: joi_config_1.description,
    position: (0, joi_config_1._stringDefault)({ min: 0, max: 100, title: 'Vị trí' }),
    technology: joi_config_1._arrayString,
    companyId: joi_1.default.string().trim().strict(),
    images: joi_config_1._arrayString,
    link: (0, joi_config_1._stringDefault)({ min: 0, max: 100, title: 'Liên kết' }),
    isWorking: joi_config_1._boolean,
    startDate: joi_config_1.startDate,
    endDate: joi_config_1.endDate,
    candidateId: joi_config_1.candidateId,
});
