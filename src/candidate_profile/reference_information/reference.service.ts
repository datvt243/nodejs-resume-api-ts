/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import ReferenceModel from '@/models/reference.modal';
import { baseFindDocument, baseDeleteDocument, baseUpdateDocument, baseCreateDocument } from '@/services';

const MODEL = ReferenceModel;

export const handlerGet = async (candidateId: string) => {
    return await baseFindDocument({ fields: { candidateId: candidateId }, model: MODEL, findOne: false });
};

export const handlerCreate = async (item: Record<string, any>) => {
    /**
     *
     */
    const result = await baseCreateDocument({
        document: { ...item },
        model: MODEL,
        name: 'Thông tin người tham khảo',
        hookAfterSave: async (doc, { data }) => {
            const { success, data: find } = await baseFindDocument({
                model: MODEL,
                fields: { candidateId: doc.candidateId },
                findOne: false,
            });
            success && (data = find);
        },
        hookHasErrors: ({ err }) => {
            //
        },
    });

    return result;
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
        name: 'Thông tin người tham khảo',
    });
};
