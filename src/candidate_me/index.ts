/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { formatReturn, _throwError } from '@/utils';
import { formatReturnFailed } from '@/services';
import { createCV } from '@/services/createPDF';
import * as MODEL from '@/models';

export const fnGetAboutMe = async (req: Request, res: Response) => {
    const { email } = req.params;
    if (!email) res.status(StatusCodes.BAD_REQUEST).json(formatReturnFailed('Không tìm thấy Email'));

    /**
     * get data
     */
    try {
        const _me = await handlerGetAboutMe(email);
        return formatReturn(res, _me);
    } catch (err) {
        _throwError(res, err);
    }
};

export const handlerGetAboutMe = async (email: string) => {
    const removeFields = { __v: 0, createdAt: 0, updatedAt: 0, candidateId: 0 };

    const document = await MODEL.Candidate.findOne({ email }, {...removeFields}).exec();
    if (!document) return formatReturnFailed('Email không tồn tại');

    const { _id } = document;

    /**
     * lấy thông tin liên quan [học vấn, kinh nghiệm, người liên hệ]
     */
    const getMoreInfo: { collection: string; model: any }[] = [
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
        const _find: undefined | Record<string, any> | Record<string, any>[] = await model
            .find({ candidateId: _id }, { _id: 0, ...removeFields })
            .exec();
        if (!_find) continue;
        dataResult[collection] = _find;
    }

    dataResult['generalInformation'] = ((data: Record<string, any>[]) => {
        if (!data.length) return  {}
        return data[0]
    })(dataResult['generalInformation'])


    return {
        success: true,
        data: dataResult,
        message: 'Lấy thông tin ứng viên thành công',
    };
};

export const fnExportPDF = async (req: Request, res: Response) => {
    /**
     *
     */

    const _id = req.body.candidateId;
    if (!_id) {
        res.status(StatusCodes.BAD_REQUEST).json(formatReturnFailed('CandidateId not found'));
        return;
    }

    const find = await MODEL.Candidate.findById(_id).exec();
    if (!find) {
        res.status(StatusCodes.BAD_REQUEST).json(formatReturnFailed('Candidate not found'));
        return;
    }

    const { email } = find;
    if (!email) {
        res.status(StatusCodes.BAD_REQUEST).json(formatReturnFailed('Email not found'));
        return;
    }

    try {
        const { success, data } = await handlerGetAboutMe(email);
        if (!success) {
            res.status(StatusCodes.BAD_REQUEST).json(formatReturnFailed('Lấy thông tin ứng viên thất bại'));
            return;
        }
        await createCV(data, res);
    } catch (err) {
        _throwError(res, err);
    }
};
