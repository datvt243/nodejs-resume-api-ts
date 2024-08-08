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
exports.handlerDelete = exports.handlerUpdate = exports.handlerCreate = exports.handlerGet = void 0;
const generalInformation_model_1 = __importDefault(require("@/models/generalInformation.model"));
const services_1 = require("@/services");
const MODEL = generalInformation_model_1.default;
const handlerGet = async (candidateId) => {
    return await (0, services_1.baseFindDocument)({ fields: { candidateId: candidateId }, model: MODEL, findOne: false });
};
exports.handlerGet = handlerGet;
const handlerCreate = async (document) => {
    /**
     * @return
     *  success: boolean,
     *  message: string,
     *  data: Document,
     *  error: Array | null
     *
     */
    /**
     * check candidate has any document,
     *  - is has: don't save
     */
    const { success, data } = await (0, services_1.baseFindDocument)({
        model: MODEL,
        fields: { candidateId: document?.candidateId },
    });
    if (success && !!data) {
        return {
            success: false,
            message: 'Candidate already has information, can not save',
        };
    }
    /**
     * save
     */
    return await (0, services_1.baseCreateDocument)({
        document: { ...document },
        model: MODEL,
        name: 'Thông tin chung',
        hookAfterSave: async (doc, { data }) => {
            const { success, data: find } = await (0, services_1.baseFindDocument)({
                model: MODEL,
                fields: { candidateId: doc.candidateId },
                findOne: false,
            });
            success && (data = find);
        },
        hookHasErrors: ({ err }) => {
            //
        },
    });
};
exports.handlerCreate = handlerCreate;
const handlerUpdate = async (document) => {
    /**
     * @return
     *  success: boolean,
     *  message: string,
     *  data: Document,
     *  error: Array | null
     *
     */
    return await (0, services_1.baseUpdateDocument)({
        document: { ...document },
        model: MODEL,
    });
};
exports.handlerUpdate = handlerUpdate;
const handlerDelete = async (id, userID) => {
    return await (0, services_1.baseDeleteDocument)({
        model: MODEL,
        _id: id,
        userID,
        name: 'Thông tin chung',
    });
};
exports.handlerDelete = handlerDelete;
/* export const handerUpdateFields = async (req, res) => {
    

    return await basePatchDocument({
        document: { ...document },
        model: MODEL,
    });
}; */
