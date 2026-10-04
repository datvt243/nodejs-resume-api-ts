import { schemaCertificate } from './certificate.validate';
import * as certificateService from './certificate.service';
import { createCrudController } from '@/candidate_profile/BaseController';

export const { fnCreate, fnUpdate } = createCrudController({
  schema: schemaCertificate,
  service: certificateService,
  booleanDefaultField: 'isNoExpiration',
});
