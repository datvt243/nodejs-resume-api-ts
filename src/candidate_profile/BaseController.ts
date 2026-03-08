import { Response, Request, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

import { formatReturn, handleError } from '@/utils/index';
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

export const baseGetAll = async (req: Request, res: Response, next: NextFunction) => {
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
    handleError(err, next);
  }
};

export const baseDelete = async (req: Request, res: Response, next: NextFunction) => {
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
    handleError(err, next);
  }
};
