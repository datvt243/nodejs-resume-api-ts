import AwardModel from '@/models/award.model';
import { createCrudService } from '@/candidate_profile/BaseService';

export const { handlerGet, handlerCreate, handlerUpdate, handlerDelete } = createCrudService({
  model: AwardModel,
  name: 'giải thưởng',
});
