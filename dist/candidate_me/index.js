"use strict";
/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
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
exports.fnExportPDF = exports.handlerGetAboutMe = exports.fnGetAboutMe = void 0;
const http_status_codes_1 = require("http-status-codes");
const utils_1 = require("@/utils");
const services_1 = require("@/services");
const createPDF_1 = require("@/services/createPDF");
const MODEL = __importStar(require("@/models"));
const fnGetAboutMe = async (req, res) => {
    const { email } = req.params;
    if (!email)
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json((0, services_1.formatReturnFailed)('Không tìm thấy Email'));
    /**
     * get data
     */
    try {
        const _me = await (0, exports.handlerGetAboutMe)(email);
        return (0, utils_1.formatReturn)(res, _me);
    }
    catch (err) {
        (0, utils_1._throwError)(res, err);
    }
};
exports.fnGetAboutMe = fnGetAboutMe;
const handlerGetAboutMe = async (email) => {
    const document = await MODEL.Candidate.findOne({ email }).exec();
    if (!document)
        return (0, services_1.formatReturnFailed)('Email không tồn tại');
    const { _id } = document;
    /**
     * lấy thông tin liên quan [học vấn, kinh nghiệm, người liên hệ]
     */
    const getMoreInfo = [
        { collection: 'generalInformation', model: MODEL.generalInformation },
        { collection: 'experiences', model: MODEL.Experience },
        { collection: 'educations', model: MODEL.Education },
        { collection: 'references', model: MODEL.Reference },
        { collection: 'projects', model: MODEL.Project },
        { collection: 'certificates', model: MODEL.Certificate },
        { collection: 'awards', model: MODEL.Award },
    ];
    const dataResult = JSON.parse(JSON.stringify(document));
    delete dataResult.password;
    for (const { collection, model } of getMoreInfo) {
        dataResult[collection] = [];
        const _find = await model.find({ candidateId: _id }).exec();
        if (!_find)
            continue;
        dataResult[collection] = _find;
    }
    /**
     * remove các property bảo mật và dư thừa
     */
    const keys = ['password', '__v', 'createdAt', 'updatedAt'];
    for (const key of keys) {
        delete dataResult[key];
    }
    for (const { collection } of getMoreInfo) {
        for (const record of dataResult[collection]) {
            for (const key of keys) {
                delete record[key];
            }
        }
    }
    return {
        success: true,
        data: dataResult,
        message: 'Lấy thông tin ứng viên thành công',
    };
};
exports.handlerGetAboutMe = handlerGetAboutMe;
const fnExportPDF = async (req, res) => {
    /**
     *
     */
    const _id = req.body.candidateId;
    if (!_id) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json((0, services_1.formatReturnFailed)('CandidateId not found'));
        return;
    }
    const find = await MODEL.Candidate.findById(_id).exec();
    if (!find) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json((0, services_1.formatReturnFailed)('Candidate not found'));
        return;
    }
    const { email } = find;
    if (!email) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json((0, services_1.formatReturnFailed)('Email not found'));
        return;
    }
    try {
        const { success, data } = await (0, exports.handlerGetAboutMe)(email);
        if (!success) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json((0, services_1.formatReturnFailed)('Lấy thông tin ứng viên thất bại'));
            return;
        }
        await (0, createPDF_1.createCV)(data, res);
    }
    catch (err) {
        (0, utils_1._throwError)(res, err);
    }
};
exports.fnExportPDF = fnExportPDF;
