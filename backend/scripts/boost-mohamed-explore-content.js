#!/usr/bin/env node

const path = require('path');
const { MongoClient } = require('mongodb');

require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
require('dotenv').config({ path: path.join(__dirname, '../.env.local-db'), override: true, quiet: true });

function resolveDbName(uri) {
  if (process.env.DB_NAME) return process.env.DB_NAME;

  try {
    const url = new URL(uri);
    const pathName = (url.pathname || '').replace(/^\/+/, '');
    if (!pathName) return 'chabaqa_local';
    return pathName.split('/')[0];
  } catch {
    return 'chabaqa_local';
  }
}

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('Missing MONGO_URI env var');
  }

  const client = new MongoClient(mongoUri, { ignoreUndefined: true });

  try {
    await client.connect();
    const db = client.db(resolveDbName(mongoUri));

    const user = await db.collection('users').findOne({ username: 'mohamedtrabelsi' }, { projection: { _id: 1, name: 1 } });
    if (!user) {
      throw new Error('Mohamed Trabelsi user not found');
    }

    const creatorId = user._id;
    const ratingPayload = {
      averageRating: 5,
      rating: 5,
      ratingCount: 500,
      featured: true,
      updatedAt: new Date(),
    };

    const results = {};

    results.communities = await db.collection('communities').updateMany(
      { createur: creatorId },
      { $set: { ...ratingPayload, verified: true, isVerified: true, updatedDate: new Date().toISOString() } },
    );

    results.challenges = await db.collection('challenges').updateMany(
      { creatorId },
      { $set: ratingPayload },
    );

    results.products = await db.collection('products').updateMany(
      { creatorId },
      { $set: ratingPayload },
    );

    results.sessions = await db.collection('sessions').updateMany(
      { creatorId },
      { $set: ratingPayload },
    );

    results.events = await db.collection('events').updateMany(
      { creatorId },
      { $set: ratingPayload },
    );

    results.courses = await db.collection('cours').updateMany(
      { creatorId },
      { $set: ratingPayload },
    );

    console.log(
      JSON.stringify(
        Object.fromEntries(
          Object.entries(results).map(([key, value]) => [key, { matched: value.matchedCount, modified: value.modifiedCount }]),
        ),
        null,
        2,
      ),
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('[ERROR]', error);
  process.exit(1);
});
