/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import generalInformationSchema from '@/models/generalInformation.model';
import { baseFindDocument, baseDeleteDocument, baseUpdateDocument, baseCreateDocument, basePatchDocument } from '@/services';
import { withDBTimeout } from '@/utils/timeout';

const MODEL = generalInformationSchema;

export const handlerGet = async (candidateId: string) => {
  try {
    return await withDBTimeout(baseFindDocument({ fields: { candidateId: candidateId }, model: MODEL, findOne: false }));
  } catch (error: any) {
    return { success: false, message: 'Failed to fetch data', error: error.message };
  }
};

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
        name: 'Thông tin chung',
        hookAfterSave: async (doc, { data }) => {
          const { success, data: find } = await withDBTimeout(
            baseFindDocument({
              model: MODEL,
              fields: { candidateId: doc.candidateId },
              findOne: false,
            }),
          );
          success && (data = find);
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

export const handlerUpdate = async (document: Record<string, any>) => {
  /**
   * @return
   *  success: boolean,
   *  message: string,
   *  data: Document,
   *  error: Array | null
   *
   */

  try {
    return await withDBTimeout(
      baseUpdateDocument({
        document: { ...document },
        model: MODEL,
      }),
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: 'Failed to update document', error: errorMsg };
  }
};

export const handlerDelete = async (id: string, userID: string) => {
  try {
    return await withDBTimeout(
      baseDeleteDocument({
        model: MODEL,
        _id: id,
        userID,
        name: 'Thông tin chung',
      }),
    );
  } catch (error: any) {
    return { success: false, message: 'Failed to delete document', error: error.message };
  }
};

/* export const handerUpdateFields = async (req, res) => {
    

    return await basePatchDocument({
        document: { ...document },
        model: MODEL,
    });
}; */
