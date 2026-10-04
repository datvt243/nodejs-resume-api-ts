import { Model } from 'mongoose';
import ProfileModel from '@/models/profile.model';
import * as MODELS from '@/models';
import { createCrudService } from '@/candidate_profile/BaseService';
import { CrudDocument } from '@/services';

export const { handlerGet, handlerCreate, handlerUpdate, handlerDelete } = createCrudService({
  model: ProfileModel,
  name: 'profile',
});

/**
 * Default profile, no data loss (issue #133): a candidate with zero rows in
 * `profiles` (brand new, or never created a custom one) gets a "Tổng hợp"
 * (All) profile synthesized on first read, containing every existing
 * section item's _id — so GET /api/me/:value's ?profile= filter always has
 * something to resolve to, and no existing candidate's data disappears.
 */
export const ensureDefaultProfile = async (candidateId: string) => {
  const existing = await ProfileModel.countDocuments({ candidateId, deletedAt: null });
  if (existing > 0) return;

  /**
   * `Model<CrudDocument>` + a narrow, justified cast per caller — same
   * Mongoose `Model<T>` invariance pattern `type-crud-core`/#181
   * established (no concrete model can be assigned to a fixed, different
   * `Model<CrudDocument>` slot without one).
   */
  const idsOf = async (model: Model<CrudDocument>) => (await model.find({ candidateId, deletedAt: null }, '_id').exec()).map((doc) => doc._id);

  const [educationIds, experienceIds, projectIds, certificateIds, awardIds, referenceIds] = await Promise.all([
    idsOf(MODELS.Education as unknown as Model<CrudDocument>),
    idsOf(MODELS.Experience as unknown as Model<CrudDocument>),
    idsOf(MODELS.Project as unknown as Model<CrudDocument>),
    idsOf(MODELS.Certificate as unknown as Model<CrudDocument>),
    idsOf(MODELS.Award as unknown as Model<CrudDocument>),
    idsOf(MODELS.Reference as unknown as Model<CrudDocument>),
  ]);

  await ProfileModel.create({
    candidateId,
    name: 'Tổng hợp',
    educationIds,
    experienceIds,
    projectIds,
    certificateIds,
    awardIds,
    referenceIds,
  });
};
