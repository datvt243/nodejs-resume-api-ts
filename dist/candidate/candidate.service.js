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
exports.handlerUpdate = exports.handlerGetInformationByEmail = exports.handlerGetInformationById = void 0;
const candidate_model_1 = __importDefault(require("@/models/candidate.model"));
const utils_1 = require("@/utils");
const MODEL = candidate_model_1.default;
const handlerGetInformationById = async (id, props = { select: '' }) => {
    const { select = '' } = props;
    const find = MODEL.findById(id);
    if (select) {
        find.select(select);
    }
    return await find.exec();
};
exports.handlerGetInformationById = handlerGetInformationById;
const handlerGetInformationByEmail = async (email) => {
    const find = await MODEL.findOne({ email }).exec();
    return find;
};
exports.handlerGetInformationByEmail = handlerGetInformationByEmail;
const handlerUpdate = async (item) => {
    /**
     * @return
     *  success: boolean,
     *  message: string,
     *  data: Document,
     *  errors: Array
     *
     */
    if (!(await MODEL.findById(item._id))) {
        return { success: false, message: 'ID không tồn tại' };
    }
    const value = { ...item };
    /**
     * validate data trước khi lưu vào database
     */
    const { valid, message, errors } = await (0, utils_1.validateModel)(MODEL, value);
    if (!valid)
        return { success: false, message, errors };
    /**
     * update
     */
    const res = await MODEL.updateOne({ _id: value._id || '' }, value).exec();
    /**
     * lấy thông tin vừa update
     */
    const _select = getSelectFields(value);
    const _find = await (0, exports.handlerGetInformationById)(value._id, { select: _select });
    /**
     * return
     */
    return { success: true, message: 'Cập nhật thành công', errors: {}, data: _find ? _find : {} };
};
exports.handlerUpdate = handlerUpdate;
const getSelectFields = (val) => {
    let f = [];
    for (const v of Object.keys(val)) {
        f.push(v);
    }
    return f.join(' ');
};
