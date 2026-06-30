/**
 * seed-plans.ts
 *
 * Upserts the canonical plan documents into MongoDB.
 * Run once on first deploy and again whenever plan details change.
 *
 * Usage:
 *   npx ts-node --project tsconfig.json scripts/seed-plans.ts
 *
 * Requires MONGODB_URI in the environment (or loads from .env).
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { PlanSchema } from '@/infrastructure/database/schemas/commerce/plan.schema';
import { DEFAULT_CREATOR_PLAN_DOCS } from '@/domains/commerce/subscription/default-creator-plans';

const MONGODB_URI = process.env.MONGODB_URI ?? process.env.MONGO_URI ?? '';

if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI is not set. Export it or add it to .env');
  process.exit(1);
}

const Plan = mongoose.model('Plan', PlanSchema);

const PLANS = DEFAULT_CREATOR_PLAN_DOCS;

async function seed(): Promise<void> {
  console.log('🌱  Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅  Connected.');

  for (const plan of PLANS) {
    const result = await Plan.findOneAndUpdate(
      { tier: plan.tier },
      { $set: plan },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log(`  → ${plan.tier.toUpperCase()} plan upserted (id: ${result._id})`);
  }

  console.log('🎉  All plans seeded successfully.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
