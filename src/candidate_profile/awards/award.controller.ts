import { schemaAward } from './award.validate';
import * as awardService from './award.service';
import { createCrudController } from '@/candidate_profile/BaseController';

export const { fnCreate, fnUpdate } = createCrudController({
  schema: schemaAward,
  service: awardService,
  booleanDefaultField: 'isNoExpiration',
});
