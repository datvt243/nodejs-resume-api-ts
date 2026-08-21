/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import generalInformationSchema from '@/models/generalInformation.model';
import { baseFindDocument, baseCreateDocument } from '@/services';
import { withDBTimeout } from '@/utils/timeout';
import { createCrudService } from '@/candidate_profile/BaseService';

const MODEL = generalInformationSchema;
const NAME = 'Thông tin chung';

export const { handlerGet, handlerUpdate, handlerDelete } = createCrudService({ model: MODEL, name: NAME });

export const handlerCreate = async (document: Record<string, any>) => {
  /**
   * @return
   *  success: boolean,
   *  message: string,
   *  data: Document,
   *  error: Array | null
   *
   */

  /**
   * check candidate has any document,
   *  - is has: don't save
   */
  const { success, data } = await withDBTimeout(
    baseFindDocument({
      model: MODEL,
      fields: { candidateId: document?.candidateId },
    }),
  );
  if (success && !!data) {
    return {
      success: false,
      message: 'Candidate already has information, can not save',
    };
  }

  /**
   * save
   */
  try {
    return await withDBTimeout(
      baseCreateDocument({
        document: { ...document },
        model: MODEL,
        name: NAME,
        hookAfterSave: async (doc) => {
          const { success, data: find } = await withDBTimeout(
            baseFindDocument({
              model: MODEL,
              fields: { candidateId: doc.candidateId },
              findOne: false,
            }),
          );
          return success ? find : undefined;
        },
        hookHasErrors: ({ err }) => {
          //
        },
      }),
    );
  } catch (error: any) {
    return { success: false, message: 'Failed to create document', error: error.message };
  }
};

/* export const handerUpdateFields = async (req, res) => {
    

    return await basePatchDocument({
        document: { ...document },
        model: MODEL,
    });
}; */
