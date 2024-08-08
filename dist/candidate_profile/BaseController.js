"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseDelete = exports.baseGetAll = void 0;
const http_status_codes_1 = require("http-status-codes");
const index_1 = require("@/utils/index");
const services_1 = require("@/services");
const MODELS = __importStar(require("@/models"));
const modelObject = {
    generalInformation: MODELS.generalInformation,
    experiences: MODELS.Experience,
    educations: MODELS.Education,
    references: MODELS.Reference,
    projects: MODELS.Project,
    certificates: MODELS.Certificate,
    awards: MODELS.Award,
};
/* export const baseFindDocument = async (req: Request, res: Response) => {
    const { collection, fields, findOne = true } = req.body;

    if (!collection || !fields || !Object.keys(fields).length)
        return formatReturn(res, {
            success: false,
            message: 'Không tìm thấy data',
        });

    const MODEL = modelObject[collection];
    let find;
    if (findOne) {
        find = await MODEL.findOne({ ...fields }).exec();
    } else {
        find = await MODEL.find({ ...fields }).exec();
    }
    return formatReturn(res, {
        success: true,
        data: find,
        message: '',
        errors: null,
    });
}; */
const baseGetAll = async (req, res) => {
    const { candidateId, collection } = req.body;
    if (!candidateId || !collection || !modelObject[collection])
        return (0, index_1.formatReturn)(res, { statusCode: http_status_codes_1.StatusCodes.NOT_FOUND, data: null, message: 'Xảy ra lỗi! Không tìm thấy data' });
    try {
        const _result = await (0, services_1.baseFindDocument)({
            fields: { candidateId: candidateId },
            model: modelObject[collection],
            findOne: false,
        });
        return (0, index_1.formatReturn)(res, { ..._result });
    }
    catch (err) {
        (0, index_1._throwError)(res, err);
    }
};
exports.baseGetAll = baseGetAll;
const baseDelete = async (req, res) => {
    const { id, collection = '' } = req.params;
    if (!id)
        return (0, index_1.formatReturn)(res, { success: false, message: 'Xảy ra lỗi! Không tìm thấy ID' });
    if (!(collection && modelObject[collection]))
        return (0, index_1.formatReturn)(res, { success: false, message: 'Xảy ra lỗi! Không thể xoá' });
    /**
     * delete
     */
    try {
        const _result = await (0, services_1.baseDeleteDocument)({
            model: modelObject[collection],
            _id: id,
            userID: req.body.candidateId || '',
            name: '',
        });
        return (0, index_1.formatReturn)(res, { ..._result });
    }
    catch (err) {
        //
        (0, index_1._throwError)(res, err);
    }
};
exports.baseDelete = baseDelete;
