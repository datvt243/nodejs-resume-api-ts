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
exports.bcryptCompareHash = exports.bcryptGenerateSalt = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const saltRounds = 10;
const bcryptGenerateSalt = (pass) => {
    const salt = bcrypt_1.default.genSaltSync(saltRounds);
    const hash = bcrypt_1.default.hashSync(pass, salt);
    return hash || pass;
};
exports.bcryptGenerateSalt = bcryptGenerateSalt;
const bcryptCompareHash = async (str, hash) => {
    if (!str || !hash)
        return false;
    const match = await bcrypt_1.default.compare(str, hash);
    return match;
};
exports.bcryptCompareHash = bcryptCompareHash;
