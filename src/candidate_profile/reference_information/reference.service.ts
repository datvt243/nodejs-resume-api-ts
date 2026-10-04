import ReferenceModel from '@/models/reference.modal';
import { createCrudService } from '@/candidate_profile/BaseService';

export const { handlerGet, handlerCreate, handlerUpdate, handlerDelete } = createCrudService({
  model: ReferenceModel,
  name: 'Thông tin người tham khảo',
});
