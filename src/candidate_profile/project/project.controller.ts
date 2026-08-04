/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import { schemaProject } from './project.validate';
import * as projectService from './project.service';
import { createCrudController } from '@/candidate_profile/BaseController';

export const { fnCreate, fnUpdate } = createCrudController({
  schema: schemaProject,
  service: projectService,
  booleanDefaultField: 'isWorking',
});
