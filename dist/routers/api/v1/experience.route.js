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
const base_type_1 = require("@/types/base.type");
const BaseController_1 = require("@/candidate_profile/BaseController");
const experience_controller_1 = require("@/candidate_profile/experience/experience.controller");
const router = express_1.default.Router();
router.get('/', (req, res, next) => {
    req.body.collection = base_type_1.Collections.EXPERIENCE;
    next();
}, BaseController_1.baseGetAll);
router.post('/create', experience_controller_1.fnCreate);
router.put('/update', experience_controller_1.fnUpdate);
router.delete('/delete/:id', (req, res, next) => {
    req.params.collection = base_type_1.Collections.EXPERIENCE;
    next();
}, BaseController_1.baseDelete);
exports.default = router;
