/**
 * Regression coverage for issue #159 — language.middleware.ts (Accept-Language
 * → req.lang / req.t) had no unit tests despite gating i18n for every route.
 */

import { Request, Response, NextFunction } from 'express';
import { languageMiddleware } from '@/middlewares/language.middleware';

const mockRequest = (acceptLanguage?: string) =>
  ({
    headers: acceptLanguage === undefined ? {} : { 'accept-language': acceptLanguage },
  }) as Request;

const mockResponse = () => ({}) as Response;

describe('middlewares/language.middleware', () => {
  const next = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('defaults to vi when Accept-Language is absent', () => {
    const req: any = mockRequest();
    languageMiddleware(req, mockResponse(), next);

    expect(req.lang).toBe('vi');
    expect(next).toHaveBeenCalled();
  });

  it('resolves a plain supported tag', () => {
    const req: any = mockRequest('en');
    languageMiddleware(req, mockResponse(), next);

    expect(req.lang).toBe('en');
  });

  it('takes the primary subtag of a regional tag (en-US -> en)', () => {
    const req: any = mockRequest('en-US');
    languageMiddleware(req, mockResponse(), next);

    expect(req.lang).toBe('en');
  });

  it('takes the first weighted tag in a multi-tag header', () => {
    const req: any = mockRequest('en-US,en;q=0.9,vi;q=0.8');
    languageMiddleware(req, mockResponse(), next);

    expect(req.lang).toBe('en');
  });

  it('is case-insensitive', () => {
    const req: any = mockRequest('EN');
    languageMiddleware(req, mockResponse(), next);

    expect(req.lang).toBe('en');
  });

  it('falls back to vi for an unsupported language', () => {
    const req: any = mockRequest('fr-FR');
    languageMiddleware(req, mockResponse(), next);

    expect(req.lang).toBe('vi');
  });

  it('attaches req.t bound to the resolved language, delegating to the real i18n table', () => {
    const req: any = mockRequest('en');
    languageMiddleware(req, mockResponse(), next);

    expect(req.t('auth.loginSuccess')).toBe('Login successful');
  });

  it('req.t falls back to vi when resolved as vi', () => {
    const req: any = mockRequest();
    languageMiddleware(req, mockResponse(), next);

    expect(req.t('auth.loginSuccess')).toBe('Đăng nhập thành công');
  });
});
