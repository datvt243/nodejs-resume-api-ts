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
exports.handlerGetEducationById = exports.handlerCheckEducationId = exports.handlerDelete = exports.handlerUpdate = exports.handlerCreate = exports.handlerGet = void 0;
const education_model_1 = __importDefault(require("@/models/education.model"));
const services_1 = require("@/services");
const MODEL = education_model_1.default;
const NAME = 'Học vấn';
const handlerGet = async (candidateId) => {
    return await (0, services_1.baseFindDocument)({ fields: { candidateId: candidateId }, model: MODEL, findOne: false });
};
exports.handlerGet = handlerGet;
const handlerCreate = async (item) => {
    /**
     *
     */
    return await (0, services_1.baseCreateDocument)({
        document: { ...item },
        model: MODEL,
        name: NAME,
        hookAfterSave: async (doc, { data }) => {
            const { success, data: find } = await (0, services_1.baseFindDocument)({
                model: MODEL,
                fields: { candidateId: doc.candidateId },
                findOne: false, // Tìm tất cả
            });
            success && (data = find);
        },
        hookHasErrors: ({ err }) => {
            // do something
        },
    });
};
exports.handlerCreate = handlerCreate;
const handlerUpdate = async (item) => {
    /**
     * @return
     *  success: boolean,
     *  message: string,
     *  data: Document,
     *  error: Array
     *
     */
    return await (0, services_1.baseUpdateDocument)({
        document: item,
        model: MODEL,
    });
};
exports.handlerUpdate = handlerUpdate;
const handlerDelete = async (id, userID) => {
    return await (0, services_1.baseDeleteDocument)({
        model: MODEL,
        _id: id,
        userID,
        name: NAME,
    });
};
exports.handlerDelete = handlerDelete;
const handlerCheckEducationId = async (_id) => {
    /**
     *
     */
    const { success } = await (0, services_1.baseFindDocument)({
        model: MODEL,
        fields: { _id },
    });
    return success;
};
exports.handlerCheckEducationId = handlerCheckEducationId;
const handlerGetEducationById = async (_id) => {
    /**
     *
     */
    const { success, data } = await (0, services_1.baseFindDocument)({
        model: MODEL,
        fields: { _id },
    });
    return success ? data : {};
};
exports.handlerGetEducationById = handlerGetEducationById;
