/**
 * Tests for services/index.ts's baseCreateDocument — regression coverage for
 * issue #157 (data._id: null on every POST .../create response). The bug:
 * hookAfterSave used to receive `data` by destructured value, so reassigning
 * it inside the hook never reached baseCreateDocument's own `_data` variable
 * — the caller always got MODEL.create()'s raw result (`_id: null`, since
 * `{ _id: null, ...document }` is passed to create()) instead of the
 * refetched document with its real id. Fixed by using hookAfterSave's return
 * value (`replacement`) as the new `_data` when it isn't undefined. Uses a
 * fake Mongoose-shaped model, same style as baseFindDocument.test.ts.
 */
import { baseCreateDocument } from '@/services';

function createFakeModel(createdDoc: Record<string, any>) {
  return {
    validate: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockResolvedValue(createdDoc),
  };
}

describe('baseCreateDocument hookAfterSave propagation (issue #157)', () => {
  it("returns hookAfterSave's replacement as data, not the raw create() result with a null _id", async () => {
    const model = createFakeModel({ _id: null, candidateId: 'c1' });
    const realDoc = { _id: 'real-id-123', candidateId: 'c1' };

    const result = await baseCreateDocument({
      document: { candidateId: 'c1' },
      model,
      name: 'education',
      hookAfterSave: async () => realDoc,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBe(realDoc);
    expect((result.data as any)._id).toBe('real-id-123');
  });

  it('falls back to the raw create() result when hookAfterSave returns undefined', async () => {
    const createdDoc = { _id: 'created-id', candidateId: 'c1' };
    const model = createFakeModel(createdDoc);

    const result = await baseCreateDocument({
      document: { candidateId: 'c1' },
      model,
      name: 'education',
      hookAfterSave: async () => undefined,
    });

    expect(result.data).toBe(createdDoc);
  });

  it('returns the raw create() result unchanged when no hookAfterSave is given', async () => {
    const createdDoc = { _id: 'created-id-2', candidateId: 'c1' };
    const model = createFakeModel(createdDoc);

    const result = await baseCreateDocument({
      document: { candidateId: 'c1' },
      model,
      name: 'education',
    });

    expect(result.data).toBe(createdDoc);
  });
});
