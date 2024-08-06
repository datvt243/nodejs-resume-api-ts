/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import EducationModel from '@/models/education.model';
import { baseFindDocument, baseDeleteDocument, baseUpdateDocument, baseCreateDocument } from '@/services';

const MODEL = EducationModel;
const NAME = 'Học vấn';

export const handlerGet = async (candidateId: string) => {
    return await baseFindDocument({ fields: { candidateId: candidateId }, model: MODEL, findOne: false });
};

export const handlerCreate = async (item: Record<string, any>) => {
    /**
     *
     */
    return await baseCreateDocument({
        document: { ...item },
        model: MODEL,
        name: NAME,
        hookAfterSave: async (doc, { data }) => {
            const { success, data: find } = await baseFindDocument({
                model: MODEL,
                fields: { candidateId: doc.candidateId },
                findOne: false, // Tìm tất cả
            });
            success && (data = find);
        },
        hookHasErrors: ({ err }) => {
            // do something
        },
    });
};

export const handlerUpdate = async (item: Record<string, any>) => {
    /**
     * @return
     *  success: boolean,
     *  message: string,
     *  data: Document,
     *  error: Array
     *
     */

    return await baseUpdateDocument({
        document: item,
        model: MODEL,
    });
};

export const handlerDelete = async (id: string, userID: string) => {
    return await baseDeleteDocument({
        model: MODEL,
        _id: id,
        userID,
        name: NAME,
    });
};

export const handlerCheckEducationId = async (_id: string) => {
    /**
     *
     */
    const { success } = await baseFindDocument({
        model: MODEL,
        fields: { _id },
    });
    return success;
};

export const handlerGetEducationById = async (_id: string) => {
    /**
     *
     */
    const { success, data } = await baseFindDocument({
        model: MODEL,
        fields: { _id },
    });
    return success ? data : {};
};
