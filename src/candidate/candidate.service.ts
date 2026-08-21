/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */

import * as MODELS from '@/models';
import { validateModel } from '@/utils';
import { candidateQuerySafe } from '@/utils/querySafe';

const MODEL = MODELS.Candidate;

// CV section models keyed by candidateId — deleted alongside the
// candidate document itself so a self-delete doesn't leave orphaned data.
const CV_SECTION_MODELS: any[] = [
  MODELS.generalInformation,
  MODELS.Experience,
  MODELS.Education,
  MODELS.Reference,
  MODELS.Project,
  MODELS.Certificate,
  MODELS.Award,
];

export const handlerGetInformationById = async (id: string, props: { select: string } = { select: '' }) => {
  const { select = '' } = props;
  // `select` here is already a whitelisted, space-joined field list (see
  // callers) — re-wrapping it in candidateQuerySafe.whitelistSelect([select])
  // treated the whole joined string as a single field name, which never
  // matched the allow-list, silently making the select a no-op and
  // returning the full document (including password) to every caller.
  // Default to excluding password when no explicit select is given.
  const find = MODEL.findById(id).select(select || '-password');
  return await find.exec();
};

export const handlerGetInformationByEmail = async (email: string) => {
  const safeEmailQuery = candidateQuerySafe.safeQuery({}, { email });
  const find = await MODEL.findOne(safeEmailQuery).select('-password').exec();
  return find;
};

export const handlerUpdate = async (item: Record<string, any>) => {
  /**
   * @return
   *  success: boolean,
   *  message: string,
   *  data: Document,
   *  errors: Array
   *
   */

  if (!(await MODEL.findById(item._id))) {
    return { success: false, message: 'ID không tồn tại' };
  }

  const value = { ...item };

  /**
   * validate data trước khi lưu vào database
   */
  const { valid, message, errors } = await validateModel(MODEL, value);
  if (!valid) return { success: false, message, errors };

  /**
   * update
   */
  const res = await MODEL.updateOne({ _id: value._id || '' }, value).exec();

  /**
   * lấy thông tin vừa update (SAFE SELECT)
   */
  const safeSelect = candidateQuerySafe.whitelistSelect(Object.keys(value));
  const _find = await handlerGetInformationById(value._id, { select: safeSelect });
  /**
   * return
   */
  return { success: true, message: 'Cập nhật thành công', errors: {}, data: _find ? _find : {} };
};

export const handlerDelete = async (_id: string) => {
  if (!(await MODEL.findById(_id))) {
    return { success: false, message: 'ID không tồn tại' };
  }

  await Promise.all(CV_SECTION_MODELS.map((model) => model.deleteMany({ candidateId: _id })));
  await MODEL.deleteOne({ _id }).exec();

  return { success: true, message: 'Xoá tài khoản thành công', errors: {}, data: null };
};
