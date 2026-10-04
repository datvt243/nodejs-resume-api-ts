/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import { schemaEducation } from './education.validate';
import * as educationService from './education.service';
import { createCrudController } from '@/candidate_profile/BaseController';

export const { fnCreate, fnUpdate, fnBulkCreate } = createCrudController({
  schema: schemaEducation,
  service: educationService,
  booleanDefaultField: 'isCurrent',
});
