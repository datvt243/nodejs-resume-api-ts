/**
 * Regression coverage for issue #159 — i18n utility (`t`/`tErrorType`) had
 * no unit tests despite being live in the auth flow and Joi error mapping.
 */

import { t, tErrorType, SUPPORTED_LANGS, DEFAULT_LANG } from '@/utils/i18n';

describe('utils/i18n', () => {
  describe('SUPPORTED_LANGS / DEFAULT_LANG', () => {
    it('supports exactly vi and en, defaulting to vi', () => {
      expect(SUPPORTED_LANGS).toEqual(['vi', 'en']);
      expect(DEFAULT_LANG).toBe('vi');
    });
  });

  describe('t', () => {
    it('resolves a dot-path key for the requested language', () => {
      expect(t('auth.loginSuccess', 'en')).toBe('Login successful');
      expect(t('auth.loginSuccess', 'vi')).toBe('Đăng nhập thành công');
    });

    it('defaults to vi when no lang is given', () => {
      expect(t('auth.loginSuccess')).toBe('Đăng nhập thành công');
    });

    it('falls back to the default language when the key is missing under the requested language', () => {
      // 'xx' isn't a supported lang, so `locales['xx']` is undefined —
      // getNested returns undefined, and t() falls back to DEFAULT_LANG.
      expect(t('auth.loginSuccess', 'xx')).toBe('Đăng nhập thành công');
    });

    it('falls back to the key itself when the translation exists in no language', () => {
      expect(t('auth.doesNotExist', 'en')).toBe('auth.doesNotExist');
    });
  });

  describe('tErrorType', () => {
    it('does a flat lookup that treats the whole type string as one key', () => {
      // A dot-path walk of "any.required" would look for
      // locales.en.any.required (3 levels) and find nothing; tErrorType
      // instead reads locales.en.joiErrors['any.required'] directly.
      expect(tErrorType('any.required', 'en')).toBe('{{label}} is required');
      expect(tErrorType('any.required', 'vi')).toBe('{{label}} là bắt buộc');
    });

    it('falls back to the default language when missing under the requested language', () => {
      expect(tErrorType('any.required', 'xx' as any)).toBe('{{label}} là bắt buộc');
    });

    it('returns undefined (not the key) when no template exists for the type in any language', () => {
      expect(tErrorType('totally.unknown.type', 'en')).toBeUndefined();
    });
  });
});
