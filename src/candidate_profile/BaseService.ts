/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Shared CRUD handler factory for candidate_profile sections (education, experience, award, ...)
 */

import { baseFindDocument, baseCreateDocument, baseUpdateDocument, baseDeleteDocument } from '@/services';
import { withDBTimeout } from '@/utils/timeout';

export const createCrudService = (props: { model: any; name?: string }) => {
  const { model: MODEL, name = '' } = props;

  const handlerGet = async (candidateId: string) => {
    try {
      return await withDBTimeout(baseFindDocument({ fields: { candidateId }, model: MODEL, findOne: false }));
    } catch (error: any) {
      return { success: false, message: 'Failed to fetch data', error: error.message };
    }
  };

  const handlerCreate = async (item: Record<string, any>) => {
    try {
      return await withDBTimeout(
        baseCreateDocument({
          document: { ...item },
          model: MODEL,
          name,
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

  const handlerUpdate = async (item: Record<string, any>, userID?: string) => {
    try {
      return await withDBTimeout(baseUpdateDocument({ document: item, model: MODEL, userID }));
    } catch (error: any) {
      return { success: false, message: 'Failed to update document', error: error.message };
    }
  };

  const handlerDelete = async (id: string, userID: string) => {
    try {
      return await withDBTimeout(baseDeleteDocument({ model: MODEL, _id: id, userID, name }));
    } catch (error: any) {
      return { success: false, message: 'Failed to delete document', error: error.message };
    }
  };

  return { handlerGet, handlerCreate, handlerUpdate, handlerDelete };
};
