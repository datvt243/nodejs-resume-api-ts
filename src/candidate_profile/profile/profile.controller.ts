/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

import { schemaProfile } from './profile.validate';
import * as profileService from './profile.service';
import { createCrudController } from '@/candidate_profile/BaseController';

export const { fnCreate, fnUpdate } = createCrudController({
  schema: schemaProfile,
  service: profileService,
});
