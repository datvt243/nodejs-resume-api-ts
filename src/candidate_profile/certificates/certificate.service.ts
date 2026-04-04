/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import CertificateModel from '@/models/certificate.model';
import { baseFindDocument, baseDeleteDocument, baseUpdateDocument, baseCreateDocument } from '@/services';
import { withDBTimeout } from '@/utils/timeout';

const MODEL = CertificateModel;
const NAME = 'chứng chỉ';

export const handlerGet = async (candidateId: string) => {
  try {
    return await withDBTimeout(baseFindDocument({ fields: { candidateId: candidateId }, model: MODEL, findOne: false }));
  } catch (error: any) {
    return { success: false, message: 'Failed to fetch data', error: error.message };
  }
};

export const handlerCreate = async (item: Record<string, any>) => {
  /**
   *
   */
  try {
    return await withDBTimeout(
      baseCreateDocument({
        document: { ...item },
        model: MODEL,
        name: NAME,
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

export const handlerUpdate = async (item: Record<string, any>) => {
  /**
   *
   *  success: boolean,
   *  message: string,
   *  data: Document,
   *  error: Array
   *
   */

  try {
    return await withDBTimeout(
      baseUpdateDocument({
        document: item,
        model: MODEL,
      }),
    );
  } catch (error: any) {
    return { success: false, message: 'Failed to update document', error: error.message };
  }
};

export const handlerDelete = async (id: string, userID: string) => {
  try {
    return await withDBTimeout(
      baseDeleteDocument({
        model: MODEL,
        _id: id,
        userID,
        name: NAME,
      }),
    );
  } catch (error: any) {
    return { success: false, message: 'Failed to delete document', error: error.message };
  }
};
