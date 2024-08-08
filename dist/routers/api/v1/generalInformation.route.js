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
const express_1 = __importDefault(require("express"));
const generalInformation_controller_1 = require("@/candidate_profile/general_information/generalInformation.controller");
const router = express_1.default.Router();
router.get('/', generalInformation_controller_1.fnGet);
router.post('/create', generalInformation_controller_1.fnCreate);
router.put('/update', generalInformation_controller_1.fnUpdate);
router.patch('/update', generalInformation_controller_1.fnUpdateFields);
exports.default = router;
