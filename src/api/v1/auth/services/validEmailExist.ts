/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import CandidateModel from '@/models/candidate.model';

export const checkEmailAlreadyExists = async (email: string): Promise<boolean> => {
    const find = await CandidateModel.findOne({ email });
    return !!find;
};
