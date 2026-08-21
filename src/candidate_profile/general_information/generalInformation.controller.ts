/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { handlerGet, handlerCreate, handlerUpdate } from './generalInformation.service';
import { schemaGeneralInformation, schemaGeneralInformationPatch } from './generalInformation.validate';
import { formatReturn, handleError, validateSchema } from '@/utils';
import { t } from '@/utils/i18n';

const VALIDATE_SCHEMA = schemaGeneralInformation;
const VALIDATE_SCHEMA_PATCH = schemaGeneralInformationPatch;

export const fnGet = async (req: Request, res: Response, next: NextFunction) => {
  const candidateId = req.body.candidateId || '';
  if (!candidateId)
    return formatReturn(res, { statusCode: StatusCodes.NOT_FOUND, data: null, message: t('common.notFoundData', (req as any).lang) });
  try {
    const _resultRaw = await handlerGet(candidateId, (req as any).lang);

    if (!_resultRaw.success) {
      return formatReturn(res, _resultRaw);
    }

    // information trả về 1 object or null
    const rawData = (_resultRaw as any).data;
    const data = Array.isArray(rawData) ? (rawData.length ? rawData[0] : {}) : rawData;

    return formatReturn(res, {
      success: true,
      message: _resultRaw.message || '',
      data,
    });
  } catch (err) {
    handleError(err, next, (req as any).lang);
  }
};

export const fnCreate = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * validate data gửi lên
   */
  const { isValidated, value = {}, errors, message } = validateSchema({
    schema: VALIDATE_SCHEMA,
    item: { ...req.body },
    lang: (req as any).lang,
  });
  if (!isValidated) return formatReturn(res, { success: false, message, errors });

  /**
   * save mới document
   */
  try {
    const _result = await handlerCreate(value, (req as any).lang);
    return formatReturn(res, { statusCode: StatusCodes.CREATED, ..._result });
  } catch (err) {
    handleError(err, next, (req as any).lang);
  }
};

export const fnUpdate = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * validate data gửi lên
   */
  const { isValidated, value, errors, message } = validateSchema({
    schema: req.method === 'PUT' ? VALIDATE_SCHEMA : VALIDATE_SCHEMA_PATCH,
    item: { ...req.body },
    lang: (req as any).lang,
  });
  if (!isValidated) return formatReturn(res, { statusCode: StatusCodes.UNAUTHORIZED, success: false, message, errors });

  /**
   * update data
   */

  try {
    const _result = await handlerUpdate(value, (req as any).user?._id, (req as any).lang);
    return formatReturn(res, { ..._result });
  } catch (err) {
    handleError(err, next, (req as any).lang);
  }
};

export const fnUpdateFields = async (req: Request, res: Response, next: NextFunction) => {
  /**
   * validate data gửi lên
   */
  const { isValidated, value, errors, message } = validateSchema({
    schema: VALIDATE_SCHEMA_PATCH,
    item: { ...req.body },
    lang: (req as any).lang,
  });
  if (!isValidated) return formatReturn(res, { statusCode: StatusCodes.UNAUTHORIZED, success: false, message, errors });

  /**
   * update data
   */

  try {
    const _result = await handlerUpdate(value, (req as any).user?._id, (req as any).lang);
    return formatReturn(res, { ..._result });
  } catch (err) {
    handleError(err, next, (req as any).lang);
  }
};
