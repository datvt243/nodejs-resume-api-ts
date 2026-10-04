/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import { schemaReference } from './reference.validate';
import * as referenceService from './reference.service';
import { createCrudController } from '@/candidate_profile/BaseController';

export const { fnCreate, fnUpdate } = createCrudController({
  schema: schemaReference,
  service: referenceService,
});
