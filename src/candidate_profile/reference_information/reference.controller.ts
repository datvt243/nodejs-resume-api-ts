import { schemaReference } from './reference.validate';
import * as referenceService from './reference.service';
import { createCrudController } from '@/candidate_profile/BaseController';

export const { fnCreate, fnUpdate } = createCrudController({
  schema: schemaReference,
  service: referenceService,
});
