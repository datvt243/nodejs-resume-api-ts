import ProjectModel from '@/models/project.model';
import { createCrudService } from '@/candidate_profile/BaseService';

export const { handlerGet, handlerCreate, handlerUpdate, handlerDelete } = createCrudService({
  model: ProjectModel,
  name: 'dự án',
});
