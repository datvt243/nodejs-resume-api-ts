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
const router = express_1.default.Router();
const candidate_controller_1 = require("@/candidate/candidate.controller");
router.get('/:email', candidate_controller_1.fnGetInformationByEmail);
router.put('/update', candidate_controller_1.fnUpdate);
router.patch('/update', candidate_controller_1.fnUpdateFields);
exports.default = router;
