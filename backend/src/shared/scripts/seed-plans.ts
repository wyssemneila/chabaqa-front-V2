import 'dotenv/config';
import mongoose from 'mongoose';
import { Plan, PlanSchema } from '@/infrastructure/database/schemas/commerce/plan.schema';
import { DEFAULT_CREATOR_PLAN_DOCS } from '@/domains/commerce/subscription/default-creator-plans';

export const PLAN_SEED_DOCS = DEFAULT_CREATOR_PLAN_DOCS;

async function main() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/shabaka';
  await mongoose.connect(mongoUri);
  const PlanModel = mongoose.model(Plan.name, PlanSchema, 'plans');

  for (const doc of PLAN_SEED_DOCS) {
    await PlanModel.updateOne({ tier: doc.tier }, { $set: doc }, { upsert: true });
    console.log(`Seeded plan: ${doc.name}`);
  }

  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}


