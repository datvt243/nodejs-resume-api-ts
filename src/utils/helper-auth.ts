import { Request } from 'express';

/**
 * Extract a token out of various request locations.
 *
 * @param req Express request (any type accepted for flexibility)
 * @param fieldName field to look for in body/query/cookies (defaults to "token")
 */
export const extractTokenFromRequest = (req: any, fieldName = 'token'): string | null => {
  const authHeader = req.header('Authorization') || req.header('authorization') || '';
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && /bearer/i.test(parts[0])) return parts[1].trim();
    return authHeader.trim();
  }

  if (req.body && req.body[fieldName]) return String(req.body[fieldName]);
  if (req.query && (req.query as any)[fieldName]) return String((req.query as any)[fieldName]);
  if (req.cookies && req.cookies[fieldName]) return req.cookies[fieldName];

  return null;
};
