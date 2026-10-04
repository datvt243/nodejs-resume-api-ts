import generalInformationSchema from '@/models/generalInformation.model';
import { baseFindDocument, baseCreateDocument } from '@/services';
import { withDBTimeout } from '@/utils/timeout';
import { createCrudService } from '@/candidate_profile/BaseService';
import { t, DEFAULT_LANG } from '@/utils/i18n';

const MODEL = generalInformationSchema;
const NAME = 'Thông tin chung';

export const { handlerGet, handlerUpdate, handlerDelete } = createCrudService({ model: MODEL, name: NAME });

export const handlerCreate = async (document: Record<string, unknown>, lang: string = DEFAULT_LANG) => {
  // Refuse to create a second generalInformation document for a candidate that already has one.
  const candidateId = typeof document?.['candidateId'] === 'string' ? document['candidateId'] : undefined;
  const { success, data } = await withDBTimeout(
    baseFindDocument({
      model: MODEL,
      fields: { candidateId },
    }),
  );
  if (success && !!data) {
    return {
      success: false,
      message: t('generalInformation.alreadyExists', lang),
    };
  }

  try {
    return await withDBTimeout(
      baseCreateDocument({
        document: { ...document },
        model: MODEL,
        name: NAME,
        lang,
        hookAfterSave: async (doc) => {
          const savedCandidateId = typeof doc['candidateId'] === 'string' ? doc['candidateId'] : undefined;
          const { success, data: find } = await withDBTimeout(
            baseFindDocument({
              model: MODEL,
              fields: { candidateId: savedCandidateId },
              findOne: false,
            }),
          );
          return success ? find : undefined;
        },
        hookHasErrors: () => {},
      }),
    );
  } catch (error: unknown) {
    return { success: false, message: t('common.createFailed', lang), error: error instanceof Error ? error.message : String(error) };
  }
};
