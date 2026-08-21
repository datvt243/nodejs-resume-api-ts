/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { formatReturn, validateSchema, handleError } from '@/utils';
import { schemaCandidate, schemaCandidatePatch } from '@/candidate/candidate.validate';
import { handlerUpdate, handlerDelete, handlerGetInformationByEmail, handlerGetInformationById } from '@/candidate/candidate.service';

export const fnGetInformationById = async (req: Request, res: Response) => {
  const { id = '' } = req.params;
  const doc = await handlerGetInformationById(id);

  const _flag = !!doc;
  return formatReturn(res, { success: _flag, message: _flag ? '' : 'Không tìm thấy người dùng', data: doc });
};

export const fnGetInformationByEmail = async (req: Request, res: Response) => {
  const { email = '' } = req.params;
  const doc = await handlerGetInformationByEmail(email);
  const _flag = !!doc;
  return formatReturn(res, { success: _flag, message: _flag ? '' : 'Không tìm thấy người dùng', data: doc });
};

export const fnUpdate = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * validate data come from req.body
   */
  const { isValidated, value, errors } = validateSchema({ schema: schemaCandidate, item: { ...req.body } });
  if (!isValidated)
    return formatReturn(res, { statusCode: StatusCodes.UNAUTHORIZED, success: false, message: 'Xảy ra lỗi', errors });

  /**
   * update data
   * Force _id to the authenticated user's own id — never trust a client-
   * supplied _id here, or any authenticated user could overwrite another
   * candidate's profile.
   */
  try {
    const _result = await handlerUpdate({ ...value, _id: (req as any).user?._id });
    return formatReturn(res, { ..._result });
  } catch (err) {
    handleError(err, next);
  }
};

export const fnDelete = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * Self-delete only — always the authenticated user's own id, never a
   * client-supplied one (see fnUpdate for the same IDOR-safety pattern).
   */
  try {
    const _result = await handlerDelete((req as any).user?._id);
    return formatReturn(res, { ..._result });
  } catch (err) {
    handleError(err, next);
  }
};

export const fnUpdateFields = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * validate data gửi lên
   */
  const { isValidated, value, errors } = validateSchema({
    schema: schemaCandidatePatch,
    item: { ...req.body },
  });
  if (!isValidated)
    return formatReturn(res, { statusCode: StatusCodes.UNAUTHORIZED, success: false, message: 'Xảy ra lỗi', errors });

  /**
   * update data — force _id to the authenticated user (see fnUpdate)
   */
  try {
    const _result = await handlerUpdate({ ...value, _id: (req as any).user?._id });
    return formatReturn(res, { ..._result });
  } catch (err) {
    handleError(err, next);
  }
};
