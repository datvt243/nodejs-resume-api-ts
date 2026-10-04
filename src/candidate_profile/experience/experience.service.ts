/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import ExperienceModel from '@/models/experience.model';
import { createCrudService } from '@/candidate_profile/BaseService';

export const { handlerGet, handlerCreate, handlerUpdate, handlerDelete } = createCrudService({
  model: ExperienceModel,
  name: 'kinh nghiệm làm việc',
});
