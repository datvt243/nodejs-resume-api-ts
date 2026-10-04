/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Shared CRUD handler factory for candidate_profile sections (education, experience, award, ...)
 */

import { Model } from 'mongoose';
import { baseFindDocument, baseCreateDocument, baseUpdateDocument, baseDeleteDocument, CrudDocument } from '@/services';
import { withDBTimeout } from '@/utils/timeout';
import { t, DEFAULT_LANG } from '@/utils/i18n';

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export const createCrudService = <T extends CrudDocument>(props: { model: Model<T>; name?: string }) => {
  const { model: MODEL, name = '' } = props;

  const handlerGet = async (candidateId: string, lang: string = DEFAULT_LANG) => {
    try {
      return await withDBTimeout(baseFindDocument({ fields: { candidateId }, model: MODEL, findOne: false, lang }));
    } catch (error: unknown) {
      return { success: false, message: t('common.notFoundData', lang), error: errorMessage(error) };
    }
  };

  const handlerCreate = async (item: Record<string, unknown>, lang: string = DEFAULT_LANG) => {
    try {
      return await withDBTimeout(
        baseCreateDocument({
          document: { ...item },
          model: MODEL,
          name,
          lang,
          hookAfterSave: async (doc) => {
            const candidateId = typeof doc['candidateId'] === 'string' ? doc['candidateId'] : undefined;
            const { success, data: find } = await withDBTimeout(
              baseFindDocument({
                model: MODEL,
                fields: { candidateId },
                findOne: false,
              }),
            );
            return success ? find : undefined;
          },
          hookHasErrors: () => {},
        }),
      );
    } catch (error: unknown) {
      return { success: false, message: t('common.createFailed', lang), error: errorMessage(error) };
    }
  };

  const handlerUpdate = async (item: Record<string, unknown>, userID?: string, lang: string = DEFAULT_LANG) => {
    try {
      return await withDBTimeout(baseUpdateDocument({ document: item, model: MODEL, userID, lang }));
    } catch (error: unknown) {
      return { success: false, message: t('common.updateFailed', lang), error: errorMessage(error) };
    }
  };

  const handlerDelete = async (id: string, userID: string, lang: string = DEFAULT_LANG) => {
    try {
      return await withDBTimeout(baseDeleteDocument({ model: MODEL, _id: id, userID, name, lang }));
    } catch (error: unknown) {
      return { success: false, message: t('common.deleteFailed', lang), error: errorMessage(error) };
    }
  };

  return { handlerGet, handlerCreate, handlerUpdate, handlerDelete };
};
