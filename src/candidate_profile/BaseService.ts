/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Shared CRUD handler factory for candidate_profile sections (education, experience, award, ...)
 */

import { baseFindDocument, baseCreateDocument, baseUpdateDocument, baseDeleteDocument } from '@/services';
import { withDBTimeout } from '@/utils/timeout';
import { t, DEFAULT_LANG } from '@/utils/i18n';

export const createCrudService = (props: { model: any; name?: string }) => {
  const { model: MODEL, name = '' } = props;

  const handlerGet = async (candidateId: string, lang: string = DEFAULT_LANG) => {
    try {
      return await withDBTimeout(baseFindDocument({ fields: { candidateId }, model: MODEL, findOne: false, lang }));
    } catch (error: any) {
      return { success: false, message: t('common.notFoundData', lang), error: error.message };
    }
  };

  const handlerCreate = async (item: Record<string, any>, lang: string = DEFAULT_LANG) => {
    try {
      return await withDBTimeout(
        baseCreateDocument({
          document: { ...item },
          model: MODEL,
          name,
          lang,
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
      return { success: false, message: t('common.createFailed', lang), error: error.message };
    }
  };

  const handlerUpdate = async (item: Record<string, any>, userID?: string, lang: string = DEFAULT_LANG) => {
    try {
      return await withDBTimeout(baseUpdateDocument({ document: item, model: MODEL, userID, lang }));
    } catch (error: any) {
      return { success: false, message: t('common.updateFailed', lang), error: error.message };
    }
  };

  const handlerDelete = async (id: string, userID: string, lang: string = DEFAULT_LANG) => {
    try {
      return await withDBTimeout(baseDeleteDocument({ model: MODEL, _id: id, userID, name, lang }));
    } catch (error: any) {
      return { success: false, message: t('common.deleteFailed', lang), error: error.message };
    }
  };

  return { handlerGet, handlerCreate, handlerUpdate, handlerDelete };
};
