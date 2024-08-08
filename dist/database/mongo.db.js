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
const mongoose_1 = __importDefault(require("mongoose"));
const process_config_1 = require("@/config/process.config");
const utils_1 = require("@/utils");
const connectMongo = function (callback = () => { }) {
    mongoose_1.default
        .connect(`mongodb+srv://${process_config_1.MONGOBD_USER}:${process_config_1.MONGOBD_PASSWORD}@davidapi.jhhu4ml.mongodb.net/resume-api?retryWrites=true&w=majority&appName=davidAPI`)
        .then(() => {
        (0, utils_1._log)(`--------------------`);
        (0, utils_1._log)('MongoDB Connected!');
        callback?.();
    })
        .catch((err) => {
        (0, utils_1._log)({ text: `MongoDB Connect failed !!! ${err}`, type: 'error' });
    });
};
exports.default = connectMongo;
