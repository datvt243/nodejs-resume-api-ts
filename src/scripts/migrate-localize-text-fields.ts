/**
 * One-off migration for the multi-language resume content feature
 * (GitHub issue #79). Wraps existing plain-string values on the fields
 * below into the new { vi, en } shape, assuming existing content is
 * Vietnamese (matches the codebase's dominant language in validation
 * messages/seed data).
 *
 * Idempotent: each update only matches documents where the field is
 * CURRENTLY a string (MongoDB $type check), so re-running this script
 * is a no-op once a document has already been migrated.
 *
 * MUST run against a database BEFORE deploying the schema change that
 * makes these fields { vi, en } objects — old plain-string documents
 * would otherwise fail to read/cast correctly under the new schema.
 *
 * Usage: npm run migrate:localize-text
 */
import dotenv from 'dotenv';
dotenv.config();

import connectMongo, { MongoDBConnection } from '@/database/mongo.db';
import * as MODELS from '@/models';

// { model, field } pairs — matches the scope decided for issue #79:
// only free-text description/introduction-style fields, never
// proper-noun/label fields (school, company, position title, etc).
const TARGETS: { name: string; model: any; field: string }[] = [
  { name: 'Candidate.introduction', model: MODELS.Candidate, field: 'introduction' },
  { name: 'Education.description', model: MODELS.Education, field: 'description' },
  { name: 'Experience.description', model: MODELS.Experience, field: 'description' },
  { name: 'Award.description', model: MODELS.Award, field: 'description' },
  { name: 'Certificate.description', model: MODELS.Certificate, field: 'description' },
  { name: 'Project.description', model: MODELS.Project, field: 'description' },
  { name: 'generalInformation.career', model: MODELS.generalInformation, field: 'career' },
  { name: 'generalInformation.careerGoal', model: MODELS.generalInformation, field: 'careerGoal' },
];

const migrateField = async (model: any, field: string) => {
  const result = await model.updateMany({ $expr: { $eq: [{ $type: `$${field}` }, 'string'] } }, [
    { $set: { [field]: { vi: `$${field}`, en: '' } } },
  ]);
  return result.modifiedCount ?? 0;
};

const run = async () => {
  const connected = await connectMongo();
  if (!connected) {
    console.error('[migrate] Failed to connect to MongoDB — aborting.');
    process.exitCode = 1;
    return;
  }

  console.log('[migrate] Localizing free-text fields to { vi, en }...');
  for (const { name, model, field } of TARGETS) {
    const count = await migrateField(model, field);
    console.log(`[migrate] ${name}: ${count} document(s) migrated`);
  }
  console.log('[migrate] Done.');

  await MongoDBConnection.getInstance().disconnect();
};

run().catch((err) => {
  console.error('[migrate] Unexpected error:', err);
  process.exitCode = 1;
});
