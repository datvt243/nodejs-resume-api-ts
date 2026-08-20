/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import { schemaEducation } from './education.validate';
import * as educationService from './education.service';
import { createCrudController } from '@/candidate_profile/BaseController';

export const { fnCreate, fnUpdate } = createCrudController({
  schema: schemaEducation,
  service: educationService,
  booleanDefaultField: 'isCurrent',
});
