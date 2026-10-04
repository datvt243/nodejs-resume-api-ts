/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import ApplicationModel from '@/models/application.model';
import { createCrudService } from '@/candidate_profile/BaseService';

export const { handlerGet, handlerCreate, handlerUpdate, handlerDelete } = createCrudService({
  model: ApplicationModel,
  name: 'đơn ứng tuyển',
});
