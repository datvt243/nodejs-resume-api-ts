import CertificateModel from '@/models/certificate.model';
import { createCrudService } from '@/candidate_profile/BaseService';

export const { handlerGet, handlerCreate, handlerUpdate, handlerDelete } = createCrudService({
  model: CertificateModel,
  name: 'chứng chỉ',
});
