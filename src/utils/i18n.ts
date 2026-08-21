/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Minimal hand-rolled i18n — the message surface is small
 * enough that a full library (i18next, etc.) would be more machinery
 * than the app needs. See middlewares/language.middleware.ts for the
 * per-request language resolution that feeds this.
 */
import vi from '@/locales/vi';
import en from '@/locales/en';

export const SUPPORTED_LANGS = ['vi', 'en'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];
export const DEFAULT_LANG: SupportedLang = 'vi';

const locales: Record<SupportedLang, Record<string, any>> = { vi, en };

const getNested = (obj: Record<string, any> | undefined, path: string): string | undefined => {
  return path.split('.').reduce<any>((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), obj);
};

/**
 * Resolve a dot-path key (e.g. "auth.loginSuccess") for the given
 * language, falling back to the default language, then to the key
 * itself if no translation exists anywhere — never throws.
 */
export const t = (key: string, lang: string = DEFAULT_LANG): string => {
  const primary = getNested(locales[lang as SupportedLang], key);
  if (primary !== undefined) return primary;

  const fallback = getNested(locales[DEFAULT_LANG], key);
  if (fallback !== undefined) return fallback;

  return key;
};

/**
 * Joi/Mongoose error-type codes (e.g. "any.required", "string.pattern.base")
 * are themselves dot-separated strings, so they can't go through t()'s
 * generic dot-path walker (`joiErrors.${type}` would be mis-parsed as
 * nested namespaces instead of a single literal key under `joiErrors`).
 * This does a flat, one-level lookup into `joiErrors[type]` instead.
 * Returns undefined (not the key) when missing, so callers can
 * distinguish "no template for this error type" from a real translation.
 */
export const tErrorType = (type: string, lang: string = DEFAULT_LANG): string | undefined => {
  return locales[lang as SupportedLang]?.joiErrors?.[type] ?? locales[DEFAULT_LANG]?.joiErrors?.[type];
};
