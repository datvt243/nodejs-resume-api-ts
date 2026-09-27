/**
 * Regression coverage for issue #152 — GET /api/v1/candidate/:email and
 * PUT/PATCH /candidate/update used to leak the raw bcrypt password hash.
 * Root cause was 2 independent bugs in src/candidate/candidate.service.ts:
 * handlerGetInformationByEmail had no .select() at all, and
 * handlerGetInformationById double-wrapped an already-whitelisted,
 * space-joined select string in candidateQuerySafe.whitelistSelect([select])
 * (treating the whole string as one field name, which never matched the
 * allow-list, silently making the select a no-op). Both were already fixed
 * on `staging` (commit f355e2f, 2026-08-21) — this just closes the missing
 * regression-test gap.
 */
import * as MODELS from '@/models';
import { handlerGetInformationByEmail, handlerGetInformationById } from '@/candidate/candidate.service';

jest.mock('@/models', () => ({
  Candidate: { findOne: jest.fn(), findById: jest.fn() },
  generalInformation: {},
  Experience: {},
  Education: {},
  Reference: {},
  Project: {},
  Certificate: {},
  Award: {},
  Application: {},
  Profile: {},
  Visit: {},
}));

describe('candidate.service.ts password exclusion (issue #152)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handlerGetInformationByEmail', () => {
    it('always excludes the password field via .select(\'-password\')', async () => {
      const select = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: '1', email: 'a@b.com' }) });
      (MODELS.Candidate.findOne as jest.Mock).mockReturnValue({ select });

      await handlerGetInformationByEmail('a@b.com');

      expect(select).toHaveBeenCalledWith('-password');
    });
  });

  describe('handlerGetInformationById', () => {
    it('defaults to excluding password when no explicit select is given', async () => {
      const select = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: '1' }) });
      (MODELS.Candidate.findById as jest.Mock).mockReturnValue({ select });

      await handlerGetInformationById('1');

      expect(select).toHaveBeenCalledWith('-password');
    });

    it('uses the given whitelisted select string as-is, without re-wrapping it (no more double-wrap no-op)', async () => {
      const select = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: '1' }) });
      (MODELS.Candidate.findById as jest.Mock).mockReturnValue({ select });

      await handlerGetInformationById('1', { select: 'firstName lastName phone' });

      expect(select).toHaveBeenCalledWith('firstName lastName phone');
    });
  });
});
