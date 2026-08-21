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

const photoAssignments = {
  ahmedbenali: 'https://randomuser.me/api/portraits/men/11.jpg',
  fatmamseddi: 'https://randomuser.me/api/portraits/women/12.jpg',
  sarrakhemiri: 'https://randomuser.me/api/portraits/women/13.jpg',
  youssefbouallegue: 'https://randomuser.me/api/portraits/men/14.jpg',
  nesrinehadded: 'https://randomuser.me/api/portraits/women/15.jpg',
  bilelhamdi: 'https://randomuser.me/api/portraits/men/16.jpg',
  mariembenammar: 'https://randomuser.me/api/portraits/women/17.jpg',
  anasbenabdallah: 'https://randomuser.me/api/portraits/men/18.jpg',
  raniaghanmi: 'https://randomuser.me/api/portraits/women/19.jpg',
  hedimansouri: 'https://randomuser.me/api/portraits/men/20.jpg',
  inesbensalem: 'https://randomuser.me/api/portraits/women/21.jpg',
  malekdhahbi: 'https://randomuser.me/api/portraits/men/22.jpg',
  amirazouari: 'https://randomuser.me/api/portraits/women/23.jpg',
  omarlaabidi: 'https://randomuser.me/api/portraits/men/24.jpg',
  'ghassen-zaouali': 'https://randomuser.me/api/portraits/men/25.jpg',
  'wys-sem': 'https://randomuser.me/api/portraits/men/26.jpg',
};

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('Missing MONGO_URI env var');
  }

  const client = new MongoClient(mongoUri, { ignoreUndefined: true });

  try {
    await client.connect();
    const db = client.db(resolveDbName(mongoUri));
    const users = db.collection('users');

    const candidates = await users.find({
      $and: [
        { $or: [{ photo_profil: { $exists: false } }, { photo_profil: null }, { photo_profil: '' }] },
        { $or: [{ profile_picture: { $exists: false } }, { profile_picture: null }, { profile_picture: '' }] },
      ],
    }, {
      projection: { username: 1, name: 1, email: 1 },
    }).toArray();

    const updated = [];
    const skipped = [];

    for (const user of candidates) {
      const username = String(user.username || '').trim();
      const photoUrl = photoAssignments[username];

      if (!photoUrl) {
        skipped.push({ username, reason: 'no_assignment' });
        continue;
      }

      const res = await users.updateOne(
        { _id: user._id },
        {
          $set: {
            photo_profil: photoUrl,
            profile_picture: photoUrl,
          },
        },
      );

      if (res.modifiedCount > 0) {
        updated.push({ username, photoUrl });
      }
    }

    console.log(JSON.stringify({ updatedCount: updated.length, updated, skipped }, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('[ERROR]', error);
  process.exit(1);
});
