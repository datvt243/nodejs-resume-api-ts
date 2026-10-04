import { schemaExperience } from './experience.validate';
import * as experienceService from './experience.service';
import { createCrudController } from '@/candidate_profile/BaseController';

export const { fnCreate, fnUpdate, fnBulkCreate } = createCrudController({
  schema: schemaExperience,
  service: experienceService,
  booleanDefaultField: 'isCurrent',
});
