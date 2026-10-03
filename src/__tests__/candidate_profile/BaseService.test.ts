/**
 * Spot-check for issue #157 — exercises createCrudService's real
 * handlerCreate (BaseService.ts) end-to-end through the real, unmocked
 * services/index.ts (baseCreateDocument + its hookAfterSave refetch), the
 * same code path every CV section's real POST .../create endpoint uses
 * (e.g. education). Only the Mongoose model itself is faked. Confirms the
 * response's data._id is the real persisted id, not null.
 */
import type { Model } from 'mongoose';
import { createCrudService } from '@/candidate_profile/BaseService';
import { CrudDocument } from '@/services';

// createCrudService is generic over a real `Model<T>` (issue #181) — this
// fake only implements the methods it actually calls, so it's cast through
// `unknown` (relaxed test policy, tracking issue #177).
function createFakeEducationModel() {
  const docs: Record<string, any>[] = [];
  return {
    validate: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(async (doc: Record<string, any>): Promise<Record<string, any>> => {
      // Mirrors real Mongoose behavior for MODEL.create({ _id: null, ... }):
      // an explicit `_id: null` is NOT kept as null — Mongoose still
      // assigns a real ObjectId-shaped id.
      const saved: Record<string, any> = { ...doc, _id: `real-id-${docs.length + 1}` };
      docs.push(saved);
      return saved;
    }),
    find: jest.fn((query: Record<string, any>) => ({
      exec: jest.fn().mockResolvedValue(docs.filter((d) => d['candidateId'] === query['candidateId'])),
    })),
  };
}

describe('createCrudService handlerCreate — real CV section create flow (issue #157)', () => {
  it('returns the real persisted _id in data, not null, for a section like education', async () => {
    const model = createFakeEducationModel();
    const { handlerCreate } = createCrudService({ model: model as unknown as Model<CrudDocument>, name: 'education' });

    const result: any = await handlerCreate({ candidateId: 'c1', school: 'MIT' });

    expect(result.success).toBe(true);
    const data = Array.isArray(result.data) ? result.data[0] : result.data;
    expect(data._id).toBeDefined();
    expect(data._id).not.toBeNull();
    expect(data._id).toBe('real-id-1');
  });
});
