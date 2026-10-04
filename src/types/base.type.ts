import type { AppErrorDetails } from '@/errors/AppError';

export interface BaseReturn {
  type?: string;
  success?: boolean;
  message?: string;
  errors?: AppErrorDetails;
  /**
   * `unknown`, not a narrower object shape: real callers put raw hydrated
   * Mongoose documents here (which have no string index signature, so
   * they're not structurally assignable to `Record<string, unknown>`),
   * plain objects, arrays of either, or `null` — genuinely heterogeneous
   * across every BaseReturn producer in the codebase. Consumers must
   * narrow before use, same discipline as `type-candidate-modules`/#183's
   * documented `dataResult` boundary.
   */
  data?: unknown;
}

export enum Collections {
  INFORMATION = 'generalInformation',
  EXPERIENCE = 'experiences',
  EDUCATION = 'educations',
  REFERENCE = 'references',
  PROJECT = 'projects',
  CERTIFICATE = 'certificates',
  AWARD = 'awards',
  APPLICATION = 'applications',
  PROFILE = 'profiles',
}
