/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import EducationModel from '@/models/education.model';
import { baseFindDocument } from '@/services';
import { createCrudService } from '@/candidate_profile/BaseService';

const MODEL = EducationModel;

export const { handlerGet, handlerCreate, handlerUpdate, handlerDelete } = createCrudService({
  model: MODEL,
  name: 'Học vấn',
});

export const handlerCheckEducationId = async (_id: string) => {
  /**
   *
   */
  const { success } = await baseFindDocument({
    model: MODEL,
    fields: { _id },
  });
  return success;
};

export const handlerGetEducationById = async (_id: string) => {
  /**
   *
   */
  const { success, data } = await baseFindDocument({
    model: MODEL,
    fields: { _id },
  });
  return success ? data : {};
};
