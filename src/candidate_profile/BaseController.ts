import { Response, Request, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Schema } from 'joi';

import { formatReturn, handleError, validateSchema } from '@/utils/index';
import { baseDeleteDocument, baseFindDocument } from '@/services';
import * as MODELS from '@/models';
import { t } from '@/utils/i18n';
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
    return formatReturn(res, { statusCode: StatusCodes.NOT_FOUND, data: null, message: t('common.notFoundData', (req as any).lang) });

  try {
    const _result = await baseFindDocument({
      fields: { candidateId: candidateId },
      model: modelObject[collection],
      findOne: false,
      lang: (req as any).lang,
    });
    return formatReturn(res, { ..._result });
  } catch (err) {
    handleError(err, next, (req as any).lang);
  }
};

export const baseDelete = async (req: Request, res: Response, next: NextFunction) => {
  const { id, collection = '' } = req.params;

  if (!id) return formatReturn(res, { success: false, message: t('common.notFoundId', (req as any).lang) });
  if (!(collection && modelObject[collection]))
    return formatReturn(res, { success: false, message: t('common.cannotDelete', (req as any).lang) });

  /**
   * delete
   */
  try {
    const _result = await baseDeleteDocument({
      model: modelObject[collection],
      _id: id,
      userID: req.body.candidateId || '',
      name: '',
      lang: (req as any).lang,
    });
    return formatReturn(res, { ..._result });
  } catch (err) {
    //
    handleError(err, next, (req as any).lang);
  }
};

export const createCrudController = (props: {
  schema: Schema;
  service: {
    handlerCreate: (item: Record<string, any>, lang?: string) => Promise<any>;
    handlerUpdate: (item: Record<string, any>, userID?: string, lang?: string) => Promise<any>;
  };
  booleanDefaultField?: string;
}) => {
  const { schema, service, booleanDefaultField } = props;

  const fnCreate = async (req: Request, res: Response, next: NextFunction) => {
    const { isValidated, value = {}, errors, message } = validateSchema({ schema, item: { ...req.body }, lang: (req as any).lang });
    if (!isValidated) return formatReturn(res, { success: false, message, errors });

    try {
      if (booleanDefaultField && !value[booleanDefaultField]) value[booleanDefaultField] = false;
      const _result = await service.handlerCreate(value, (req as any).lang);
      return formatReturn(res, { statusCode: StatusCodes.CREATED, ..._result });
    } catch (err) {
      handleError(err, next, (req as any).lang);
    }
  };

  const fnUpdate = async (req: Request, res: Response, next: NextFunction) => {
    const { isValidated, value = {}, errors, message } = validateSchema({ schema, item: { ...req.body }, lang: (req as any).lang });
    if (!isValidated) return formatReturn(res, { success: false, message, errors });

    try {
      if (booleanDefaultField && !value[booleanDefaultField]) value[booleanDefaultField] = false;
      const _result = await service.handlerUpdate(value, (req as any).user?._id, (req as any).lang);
      return formatReturn(res, { ..._result });
    } catch (err) {
      handleError(err, next, (req as any).lang);
    }
  };

  return { fnCreate, fnUpdate };
};
