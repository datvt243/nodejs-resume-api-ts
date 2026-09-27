/**
 * Tests for candidate_me/index.ts — issue #135 regression coverage.
 *
 * QuerySafe.safeQuery silently DROPS a rejected value (e.g. containing "$")
 * instead of throwing. Before the fix, that made the resulting Mongo filter
 * collapse to {} and match an arbitrary candidate instead of failing.
 *
 * Also covers issue #153 (see bottom describe block) — a sibling instance
 * of the same "value silently dropped by QuerySafe" bug class, but at the
 * candidateId field instead of the identifier lookup: `_id` from a raw
 * Mongoose document is an ObjectId instance, not a string, and
 * QuerySafe.safeQuery only accepts string values.
 */

import * as MODEL from '@/models';
import { handlerGetAboutMe, handlerRecordVisit } from '@/candidate_me';

jest.mock('@/models', () => ({
  Candidate: { findOne: jest.fn() },
  Visit: { create: jest.fn() },
  Profile: { findOne: jest.fn() },
  generalInformation: { find: jest.fn() },
  Experience: { find: jest.fn() },
  Education: { find: jest.fn() },
  Reference: { find: jest.fn() },
  Project: { find: jest.fn() },
  Certificate: { find: jest.fn() },
  Award: { find: jest.fn() },
}));

describe('candidate_me/index.ts (issue #135)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handlerGetAboutMe', () => {
    it('fails closed and never queries the DB when the identifier is rejected by QuerySafe', async () => {
      const result = await handlerGetAboutMe('$where:1', 'vi');

      expect(result.success).toBe(false);
      expect(MODEL.Candidate.findOne).not.toHaveBeenCalled();
    });

    it('still looks up a valid identifier normally (regression check)', async () => {
      (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      const result = await handlerGetAboutMe('votan.it@gmail.com', 'vi');

      expect(result.success).toBe(false);
      expect(MODEL.Candidate.findOne).toHaveBeenCalledTimes(2); // slug attempt, then email fallback
    });
  });

  describe('handlerRecordVisit', () => {
    it('fails closed and never queries the DB when the email is rejected by QuerySafe', async () => {
      const result = await handlerRecordVisit('$where:1', { ip: '1.2.3.4', socket: {} } as any);

      expect(result.success).toBe(false);
      expect(MODEL.Candidate.findOne).not.toHaveBeenCalled();
      expect(MODEL.Visit.create).not.toHaveBeenCalled();
    });
  });

  describe('handlerGetAboutMe — profile filtering (issue #133)', () => {
    const candidateId = '507f1f77bcf86cd799439000';
    const candidateDoc = { _id: candidateId, email: 'votan.it@gmail.com' };

    beforeEach(() => {
      (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(candidateDoc) });
      const emptyFind = { exec: jest.fn().mockResolvedValue([]) };
      (MODEL.generalInformation.find as jest.Mock).mockReturnValue(emptyFind);
      (MODEL.Experience.find as jest.Mock).mockReturnValue(emptyFind);
      (MODEL.Education.find as jest.Mock).mockReturnValue(emptyFind);
      (MODEL.Reference.find as jest.Mock).mockReturnValue(emptyFind);
      (MODEL.Project.find as jest.Mock).mockReturnValue(emptyFind);
      (MODEL.Certificate.find as jest.Mock).mockReturnValue(emptyFind);
      (MODEL.Award.find as jest.Mock).mockReturnValue(emptyFind);
    });

    it('never queries Profile when no profile param is given (existing share-links unaffected)', async () => {
      await handlerGetAboutMe('votan.it@gmail.com', 'vi');

      expect(MODEL.Profile.findOne).not.toHaveBeenCalled();
      expect(MODEL.Education.find).toHaveBeenCalledWith(expect.not.objectContaining({ _id: expect.anything() }), expect.anything());
    });

    it('filters each section by the resolved profile\'s id lists', async () => {
      const educationIds = ['507f1f77bcf86cd799439012'];
      (MODEL.Profile.findOne as jest.Mock).mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ educationIds, experienceIds: [], projectIds: [], certificateIds: [], awardIds: [], referenceIds: [] }),
      });

      await handlerGetAboutMe('votan.it@gmail.com', 'vi', '507f1f77bcf86cd799439099');

      expect(MODEL.Education.find).toHaveBeenCalledWith(expect.objectContaining({ _id: { $in: educationIds } }), expect.anything());
      expect(MODEL.Experience.find).toHaveBeenCalledWith(expect.objectContaining({ _id: { $in: [] } }), expect.anything());
      // generalInformation has no id list on Profile — must stay unfiltered.
      expect(MODEL.generalInformation.find).toHaveBeenCalledWith(
        expect.not.objectContaining({ _id: expect.anything() }),
        expect.anything(),
      );
    });

    it('falls back to unfiltered data when the given profile id does not resolve for this candidate', async () => {
      (MODEL.Profile.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await handlerGetAboutMe('votan.it@gmail.com', 'vi', '507f1f77bcf86cd799439099');

      expect(MODEL.Education.find).toHaveBeenCalledWith(expect.not.objectContaining({ _id: expect.anything() }), expect.anything());
    });

    it('never queries Profile when the given id is rejected by QuerySafe (e.g. contains "$")', async () => {
      await handlerGetAboutMe('votan.it@gmail.com', 'vi', '$where:1');

      expect(MODEL.Profile.findOne).not.toHaveBeenCalled();
      expect(MODEL.Education.find).toHaveBeenCalledWith(expect.not.objectContaining({ _id: expect.anything() }), expect.anything());
    });
  });
});

describe('handlerGetAboutMe — candidateId filter with an ObjectId _id (issue #153)', () => {
  // Mirrors a real Mongoose document: _id is an ObjectId instance (has a
  // .toString() method), never a plain string. Before the fix,
  // idQuerySafe.safeQuery({}, { candidateId: _id }) silently dropped the
  // whole candidateId key (QuerySafe.safeQuery only accepts
  // typeof value === 'string'), collapsing every CV-section query's filter
  // to {} — every candidate's data came back mixed together.
  const objectIdLike = {
    toString: () => '507f1f77bcf86cd799439011',
  };
  const candidateDoc = { _id: objectIdLike, email: 'votan.it@gmail.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    (MODEL.Candidate.findOne as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(candidateDoc) });
    const emptyFind = { exec: jest.fn().mockResolvedValue([]) };
    (MODEL.generalInformation.find as jest.Mock).mockReturnValue(emptyFind);
    (MODEL.Experience.find as jest.Mock).mockReturnValue(emptyFind);
    (MODEL.Education.find as jest.Mock).mockReturnValue(emptyFind);
    (MODEL.Reference.find as jest.Mock).mockReturnValue(emptyFind);
    (MODEL.Project.find as jest.Mock).mockReturnValue(emptyFind);
    (MODEL.Certificate.find as jest.Mock).mockReturnValue(emptyFind);
    (MODEL.Award.find as jest.Mock).mockReturnValue(emptyFind);
  });

  it('stringifies an ObjectId _id before filtering, instead of dropping candidateId entirely', async () => {
    await handlerGetAboutMe('votan.it@gmail.com', 'vi');

    expect(MODEL.Education.find).toHaveBeenCalledWith(
      expect.objectContaining({ candidateId: '507f1f77bcf86cd799439011' }),
      expect.anything(),
    );
    expect(MODEL.Experience.find).toHaveBeenCalledWith(
      expect.objectContaining({ candidateId: '507f1f77bcf86cd799439011' }),
      expect.anything(),
    );
    // Never the raw object itself, and never silently dropped ({} filter).
    expect(MODEL.Education.find).not.toHaveBeenCalledWith(expect.objectContaining({ candidateId: objectIdLike }), expect.anything());
    expect(MODEL.Education.find).not.toHaveBeenCalledWith({}, expect.anything());
  });
});
