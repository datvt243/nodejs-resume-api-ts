import ApplicationModel from '@/models/application.model';
import { createCrudService } from '@/candidate_profile/BaseService';

export const { handlerGet, handlerCreate, handlerUpdate, handlerDelete } = createCrudService({
  model: ApplicationModel,
  name: 'đơn ứng tuyển',
});
