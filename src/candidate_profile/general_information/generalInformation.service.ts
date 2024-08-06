/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import generalInformationSchema from '@/models/generalInformation.model';
import { baseFindDocument, baseDeleteDocument, baseUpdateDocument, baseCreateDocument, basePatchDocument } from '@/services';

const MODEL = generalInformationSchema;

export const handlerGet = async (candidateId: string) => {
    return await baseFindDocument({ fields: { candidateId: candidateId }, model: MODEL, findOne: false });
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
    const { success, data } = await baseFindDocument({
        model: MODEL,
        fields: { candidateId: document?.candidateId },
    });
    if (success && !!data) {
        return {
            success: false,
            message: 'Candidate already has information, can not save',
        };
    }

    /**
     * save
     */
    return await baseCreateDocument({
        document: { ...document },
        model: MODEL,
        name: 'Thông tin chung',
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

    return await baseUpdateDocument({
        document: { ...document },
        model: MODEL,
    });
};

export const handlerDelete = async (id: string, userID: string) => {
    return await baseDeleteDocument({
        model: MODEL,
        _id: id,
        userID,
        name: 'Thông tin chung',
    });
};

/* export const handerUpdateFields = async (req, res) => {
    

    return await basePatchDocument({
        document: { ...document },
        model: MODEL,
    });
}; */
