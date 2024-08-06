import { Response, Request } from 'express';
import { StatusCodes } from 'http-status-codes';

import { formatReturn, _throwError } from '@/utils/index';
import { baseDeleteDocument, baseFindDocument } from '@/services';
import * as MODELS from '@/models';
interface baseProp {
    model: any;
    fields: { _id?: string; candidateId?: string };
    findOne?: boolean;
}

const modelObject: { [key: string]: any } = {
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

export const baseGetAll = async (req: Request, res: Response) => {
    const { candidateId, collection } = req.body;

    if (!candidateId || !collection || !modelObject[collection])
        return formatReturn(res, { statusCode: StatusCodes.NOT_FOUND, data: null, message: 'Xảy ra lỗi! Không tìm thấy data' });

    try {
        const _result = await baseFindDocument({
            fields: { candidateId: candidateId },
            model: modelObject[collection],
            findOne: false,
        });
        return formatReturn(res, { ..._result });
    } catch (err) {
        _throwError(res, err);
    }
};

export const baseDelete = async (req: Request, res: Response) => {
    const { id, collection = '' } = req.params;

    if (!id) return formatReturn(res, { success: false, message: 'Xảy ra lỗi! Không tìm thấy ID' });
    if (!(collection && modelObject[collection]))
        return formatReturn(res, { success: false, message: 'Xảy ra lỗi! Không thể xoá' });

    /**
     * delete
     */
    try {
        const _result = await baseDeleteDocument({
            model: modelObject[collection],
            _id: id,
            userID: req.body.candidateId || '',
            name: '',
        });
        return formatReturn(res, { ..._result });
    } catch (err) {
        //
        _throwError(res, err);
    }
};
