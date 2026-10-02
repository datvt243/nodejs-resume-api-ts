/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description:
 */
import mongoose, { Model, Types } from 'mongoose';
import type { BaseReturn } from '@/types/base.type';
import { getSelectFields } from '@/utils/helper';
import { t, DEFAULT_LANG } from '@/utils/i18n';

/**
 * The minimal raw-document shape every CV-section model shares, at the
 * level this generic CRUD core actually touches it (ownership check via
 * `candidateId`, soft-delete via `deletedAt`). Deliberately NOT extending
 * Mongoose's `Document` — `Model<T>`'s `T` type parameter is the RAW
 * schema-inferred shape (before the `Document` instance-method wrapper
 * Mongoose adds), so constraining `T` to `extends Document` would reject
 * every real model (none of their raw inferred types carry `$`-prefixed
 * Document instance methods themselves). Each `base*Document` function
 * below is generic over `T`, inferred per call site from whichever
 * concrete model is passed in — `Education`/`Experience`/etc. are NOT
 * individually typed yet (`mongoose.model(name, schema)` infers a real
 * per-field shape automatically, but that's still just a plain object
 * shape, not a shared interface), so this only requires each real model
 * to structurally satisfy these 2 optional fields, which all 9 already do.
 */
export interface CrudDocument {
  candidateId?: Types.ObjectId | string;
  deletedAt?: number | null;
  // Only 3 of the 9 CV sections (Project/Certificate/Award) actually carry
  // an `images` array, but `BaseController.ts`'s `baseUploadImages` is the
  // one generic handler that touches it across whichever section the route
  // wires it to — same shared-optional-field shape as `candidateId`/
  // `deletedAt` above, not a claim every section has images.
  images?: string[];
}

interface baseProp<T extends CrudDocument> {
  model: Model<T>;
  fields: { _id?: string; candidateId?: string };
  findOne?: boolean;
  lang?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

// Pagination (issue #73) hard cap — a caller cannot request more than this
// many documents per page regardless of what `limit` it passes.
const MAX_PAGE_LIMIT = 100;

const formatReturn = (props: BaseReturn) => {
  const { success = false, message = '', errors = null, data = null } = props;
  return {
    success,
    message,
    errors,
    data,
  };
};
export const formatReturnFailed = (props: string | BaseReturn) => {
  if (typeof props === 'string') {
    return formatReturn({ success: false, message: props, errors: null, data: null });
  }
  const { message = '', errors = null, data = null } = props;
  return {
    success: false,
    message,
    errors,
    data,
  };
};

export const baseFindDocument = async <T extends CrudDocument>(props: baseProp<T>) => {
  const { model: MODEL, fields = { _id: '' }, findOne = true, lang = DEFAULT_LANG, page, limit, sort } = props;

  if (!MODEL || !fields || !Object.keys(fields).length) return formatReturnFailed(t('common.notFoundData', lang));

  const idQuerySafe = (await import('@/utils/querySafe')).idQuerySafe;
  // Soft-delete (issue #121): exclude documents that have been soft-deleted
  // by default. `fields` can never override this key (safeQuery only ever
  // merges keys from its own allow-list into the base query), so every
  // existing caller keeps working unchanged — they just stop seeing
  // soft-deleted rows.
  const safeFields = idQuerySafe.safeQuery({ deletedAt: null }, fields);

  if (findOne) {
    const find = await MODEL.findOne(safeFields).exec();
    return formatReturn({ success: true, data: find, message: '', errors: null });
  }

  let query = MODEL.find(safeFields);
  if (sort) query = query.sort(sort);

  /**
   * Pagination (issue #73) is opt-in: it only kicks in when the caller
   * passes a valid positive `limit`. No `limit` -> exactly the old
   * behavior (`data` is the full, unpaginated array), so every existing
   * caller of baseGetAll keeps working unchanged.
   */
  const hasPagination = Number.isInteger(limit) && (limit as number) > 0;
  if (!hasPagination) {
    const find = await query.exec();
    return formatReturn({ success: true, data: find, message: '', errors: null });
  }

  const safeLimit = Math.min(limit as number, MAX_PAGE_LIMIT);
  const safePage = Number.isInteger(page) && (page as number) > 0 ? (page as number) : 1;
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([query.skip(skip).limit(safeLimit).exec(), MODEL.countDocuments(safeFields)]);

  return formatReturn({
    success: true,
    data: {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1),
      },
    },
    message: '',
    errors: null,
  });
};

export const baseDeleteDocument = async <T extends CrudDocument>(props: { model: Model<T>; _id: string; name: string; userID: string; lang?: string }) => {
  const { model: MODEL, _id: __id, userID, lang = DEFAULT_LANG } = props;

  /**
   * Check Document có tồn tại không -> findById
   */
  const { isExist, message: _mess, document } = await _baseHelper().baseCheckDocumentById(MODEL, __id, lang);
  if (!isExist) return formatReturnFailed(_mess);

  const { _id, candidateId = '' } = document;

  /**
   * Kiểm tra doc cần xoá có thuộc người đang xoá hay không
   */
  if (candidateId.toString() !== userID) return formatReturnFailed(t('common.deleteNotYours', lang));

  /**
   * Soft-delete (issue #121): mark deletedAt instead of removing the
   * document, so it can be recovered via baseRestoreDocument. Same
   * ownership check and same return shape as the old hard delete.
   */
  let success = false,
    message = t('common.deleteFailed', lang),
    error = null;
  try {
    const { modifiedCount = 0 } = await MODEL.updateOne({ _id }, { deletedAt: Date.now() }).exec();
    success = !!modifiedCount;
    message = t('common.deleteSuccess', lang);
  } catch (err) {
    error = err;
  }

  return formatReturn({
    success,
    message,
    errors: error,
  });
};

export const baseRestoreDocument = async <T extends CrudDocument>(props: { model: Model<T>; _id: string; name: string; userID: string; lang?: string }) => {
  const { model: MODEL, _id: __id, userID, lang = DEFAULT_LANG } = props;

  /**
   * Check Document có tồn tại không -> findById. `baseCheckDocumentById`
   * doesn't filter on `deletedAt`, so it finds the document whether it's
   * currently soft-deleted or not.
   */
  const { isExist, message: _mess, document } = await _baseHelper().baseCheckDocumentById(MODEL, __id, lang);
  if (!isExist) return formatReturnFailed(_mess);

  const { _id, candidateId = '' } = document;

  /**
   * Kiểm tra doc cần khôi phục có thuộc người đang khôi phục hay không
   * (cùng logic ownership check với baseDeleteDocument)
   */
  if (candidateId.toString() !== userID) return formatReturnFailed(t('common.restoreNotYours', lang));

  let success = false,
    message = t('common.restoreFailed', lang),
    error = null;
  try {
    const { modifiedCount = 0 } = await MODEL.updateOne({ _id }, { deletedAt: null }).exec();
    success = !!modifiedCount;
    message = t('common.restoreSuccess', lang);
  } catch (err) {
    error = err;
  }

  return formatReturn({
    success,
    message,
    errors: error,
  });
};

export const baseUpdateDocument = async <T extends CrudDocument>(props: {
  document: Record<string, unknown> & { _id?: string };
  model: Model<T>;
  userID?: string;
  lang?: string;
  hookHasErrors?: (props: { err: unknown }) => void;
}) => {
  /**
   * get values
   */
  const { document, model: MODEL, userID, lang = DEFAULT_LANG } = props;

  /**
   * @return
   *  success: boolean,
   *  message: string,
   *  data: Document,
   *  error: Array
   *
   */

  const _valueUpdate = { ...document };
  const { _id } = _valueUpdate;

  /**
   * Check Document có tồn tại không -> findById (loại trừ document đã
   * soft-delete — không cho update một bản ghi đã bị xoá, issue #136)
   */
  const { isExist, message: _mess, document: _existing } = await _baseHelper().baseCheckDocumentById(MODEL, _id, lang, {
    excludeDeleted: true,
  });
  if (!isExist) return formatReturnFailed(_mess);

  /**
   * Kiểm tra doc cần update có thuộc người đang update hay không
   * (đối chiếu owner của document ĐÃ TỒN TẠI, không phải candidateId gửi
   * lên trong payload — nếu không, update có thể "cướp" document của
   * người khác bằng cách gửi kèm candidateId của chính mình)
   */
  if (userID !== undefined && _existing?.candidateId !== undefined && _existing.candidateId.toString() !== userID) {
    return formatReturnFailed(t('common.updateNotYours', lang));
  }

  /**
   * validate ở mongoose model
   */
  const modelValid = await _baseHelper().modelValidate(MODEL, { ..._valueUpdate });
  if (!modelValid.success) return formatReturnFailed({ message: modelValid.message, errors: modelValid.errors });

  /**
   * Save
   */
  let _success = true,
    _message = t('common.updateSuccess', lang),
    _data = null,
    _errors = {};

  try {
    await MODEL.updateOne({ _id }, _valueUpdate).exec();
    _data = await _baseHelper().getDocumentUpdated(_id, { model: MODEL, select: getSelectFields(_valueUpdate) });
  } catch (err) {
    const { message = '', errors = [] } = _baseHelper().handlerCatchError(err);
    _success = false;
    _message = message || t('common.updateFailed', lang);
    _errors = errors;
    props?.hookHasErrors?.({ err });
  } finally {
    /**
     * return
     */
    return formatReturn({
      success: _success,
      message: _message,
      errors: _errors,
      data: _data,
    });
  }
};

export const baseCreateDocument = async <T extends CrudDocument>(props: {
  document: Record<string, unknown>;
  model: Model<T>;
  name: string;
  lang?: string;
  hookHasErrors?: (p: { err: unknown }) => Promise<void> | void;
  hookAfterSave?: (document: Record<string, unknown>, prop: BaseReturn) => Promise<unknown> | unknown;
}) => {
  const { document, model: MODEL, lang = DEFAULT_LANG } = props;

  /**
   * remove _id nếu có
   */
  delete document['_id'];

  /**
   * Nếu không có candidateId thì trả về thất bại
   */
  if (!document['candidateId']) return formatReturnFailed(t('common.createFailed', lang));

  /**
   * validate ở mongoose model
   */
  const modelValid = await _baseHelper().modelValidate(MODEL, { ...document });
  if (!modelValid.success) return formatReturnFailed({ message: modelValid.message, errors: modelValid.errors });

  /**
   * Lưu data
   */
  let _success = true,
    _data = null,
    _message = t('common.createSuccess', lang),
    _errors = {};

  try {
    _data = await MODEL.create({ _id: null, ...document });
    /**
     * callback thực hiện sau khi thêm mới thành công. Nếu hook trả về
     * (khác undefined), dùng giá trị đó thay _data — trước đây hook nhận
     * `data` qua destructure-by-value nên gán lại bên trong hook không hề
     * cập nhật _data ở đây, khiến response luôn trả nguyên kết quả thô của
     * MODEL.create() (Mongoose giữ `_id: null` như đã truyền, thay vì id
     * thật mà MongoDB gán khi lưu) thay vì list mới đã refetch.
     */
    if (props?.hookAfterSave) {
      const replacement = await props.hookAfterSave(document, { success: _success, message: _message, data: _data });
      if (replacement !== undefined) _data = replacement;
    }
  } catch (err) {
    const { message = '', errors = [] } = _baseHelper().handlerCatchError(err);
    _success = false;
    _message = message || t('common.createFailed', lang);
    _errors = errors;

    /**
     * callback if it's has error
     */
    props?.hookHasErrors?.({ err });
  } finally {
    /**
     * return
     */
    return formatReturn({ success: _success, message: _message, errors: _errors, data: _data });
  }
};

export const basePatchDocument = async <T extends CrudDocument>(props: {
  document: Record<string, unknown> & { _id?: string };
  model: Model<T>;
  lang?: string;
}) => {
  /**
   * get value
   */
  const { document, model: MODEL, lang = DEFAULT_LANG } = props;

  const { _id } = document;

  /**
   * Check Document có tồn tại không -> findById (loại trừ document đã
   * soft-delete — không cho patch một bản ghi đã bị xoá, issue #136)
   */
  const { isExist, message: _mess } = await _baseHelper().baseCheckDocumentById(MODEL, _id, lang, {
    excludeDeleted: true,
  });
  if (!isExist) return formatReturnFailed(_mess);

  /**
   * validate ở mongoose model
   */
  const modelValid = await _baseHelper().modelValidate(MODEL, { ...document });
  if (!modelValid.success) return formatReturnFailed({ message: modelValid.message, errors: modelValid.errors });

  try {
    await MODEL.updateOne({ _id }, document).exec();
    /**
     * get information
     */
    const data = await _baseHelper().getDocumentUpdated(_id, { model: MODEL, select: getSelectFields(document) });

    /**
     * return
     */
    return { success: true, message: t('common.updateSuccess', lang), errors: {}, data: data ? data : null };
  } catch (err) {
    /**
     * catch errors
     */
    return { success: false, message: t('common.updateFailed', lang), error: err, data: null };
  }
};

const _baseHelper = () => {
  return {
    getDocumentUpdated: async <T extends CrudDocument>(_id: string | undefined, props: { model: Model<T>; select: string }) => {
      const { model: MODEL } = props;
      const find = MODEL.findById(_id);
      /* if (select) {
                find.select(select);
            } */
      const record = await find.exec();
      return record;
    },
    modelValidate: async <T extends CrudDocument>(model: Model<T>, value: Record<string, unknown>) => {
      let message = '',
        success = true;
      let errors: null | string[] = null;

      try {
        await model.validate(value);
      } catch (err) {
        const errs = [];
        if (err instanceof mongoose.Error.ValidationError) {
          const { errors: _errs } = err;
          for (const k of Object.keys(_errs)) {
            errs.push(k);
          }
        }

        success = false;
        message = '';
        errors = errs;
      }
      return { success, message, errors };
    },
    handlerCatchError: (error: unknown) => {
      if (error instanceof ReferenceError) {
        return {
          message: 'ReferenceError',
          errors: [error.message],
        };
      }

      return {
        message: 'An unknown error',
        errors: {},
      };
    },
    baseCheckDocumentById: async <T extends CrudDocument>(
      MODEL: Model<T>,
      _id: string | undefined,
      lang: string = DEFAULT_LANG,
      opts: { excludeDeleted?: boolean } = {},
    ) => {
      const message = t('common.idNotFound', lang);

      // A real discriminated union (literal `true`/`false` on `isExist`)
      // instead of a shared `{isExist: boolean; document: T | null}` shape —
      // callers' `if (!isExist) return ...;` guard now actually narrows
      // `document` to non-null afterward. Before this generic pass, `MODEL`
      // (and therefore `document`) was `any`, which silently hid that every
      // caller was accessing `.candidateId`/`._id` on a value TS could not
      // prove was non-null.
      if (!_id) return { isExist: false as const, message, document: null };

      const idQuerySafe = (await import('@/utils/querySafe')).idQuerySafe;
      // Soft-delete (issue #121) excludes deletedAt-set docs from reads by
      // default (baseFindDocument), but this shared existence check was
      // never updated — update/patch could still find and mutate a
      // soft-deleted document. `excludeDeleted` is opt-in per caller:
      // baseRestoreDocument (and baseDeleteDocument) must still find a
      // document regardless of its deletedAt state.
      const baseQuery = opts.excludeDeleted ? { deletedAt: null } : {};
      const _find = await MODEL.findOne(idQuerySafe.safeQuery(baseQuery, { _id })).exec();
      if (!_find) return { isExist: false as const, message, document: null };

      return { isExist: true as const, message: '', document: _find };
    },
  };
};
