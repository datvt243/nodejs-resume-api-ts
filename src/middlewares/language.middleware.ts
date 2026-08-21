/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Resolves the request's language from Accept-Language and
 * attaches req.lang + req.t(key) for handlers to use.
 */
import { Request, Response, NextFunction } from 'express';
import { t, SUPPORTED_LANGS, DEFAULT_LANG, SupportedLang } from '@/utils/i18n';

const resolveLang = (acceptLanguage: string | undefined): SupportedLang => {
  if (!acceptLanguage) return DEFAULT_LANG;
  // Accept-Language can list multiple weighted tags (e.g. "en-US,en;q=0.9,vi;q=0.8") —
  // just take the first one's primary subtag.
  const primary = acceptLanguage.split(',')[0].trim().split('-')[0].toLowerCase();
  return (SUPPORTED_LANGS as readonly string[]).includes(primary) ? (primary as SupportedLang) : DEFAULT_LANG;
};

export const languageMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const lang = resolveLang(req.headers['accept-language']);
  (req as any).lang = lang;
  (req as any).t = (key: string) => t(key, lang);
  next();
};
