#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const apply = process.argv.includes('--apply');
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
const uploadsRoot = path.resolve(process.cwd(), process.env.UPLOAD_PATH || 'uploads');

function fallbackAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Community')}&size=256&background=8e78fb&color=ffffff&format=png`;
}

function fallbackCover(community) {
  const value = String(community.category || community.name || '').toLowerCase();
  if (value.includes('fitness')) return 'https://chabaqa.io/banners-community/community-3-fitness.png';
  if (value.includes('design') || value.includes('brand')) return 'https://chabaqa.io/banners-community/community-2-branding.png';
  if (value.includes('dev') || value.includes('tech')) return 'https://chabaqa.io/banners-community/community-4-dev.png';
  return 'https://chabaqa.io/banners-community/community-1-email-marketing.png';
}

function uploadExists(value) {
  if (!value || typeof value !== 'string') return false;
  let pathname = value;
  try {
    if (/^https?:\/\//i.test(value)) pathname = new URL(value).pathname;
  } catch {
    return false;
  }
  if (!pathname.startsWith('/uploads/')) return true;
  return fs.existsSync(path.join(uploadsRoot, pathname.replace(/^\/uploads\//, '')));
}

function firstValid(values, fallback) {
  for (const value of values) {
    if (uploadExists(value)) return value;
  }
  return fallback;
}

(async () => {
  if (!mongoUri) {
    console.error('[audit-community-media] Missing MONGODB_URI/MONGO_URI');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  const communities = await mongoose.connection.db.collection('communities').find({}).toArray();
  let changed = 0;

  for (const community of communities) {
    const logoUrl = firstValid([community.logo, community.settings?.logo], fallbackAvatar(community.name));
    const coverUrl = firstValid(
      [community.coverImage, community.photo_de_couverture, community.settings?.heroBackground],
      fallbackCover(community),
    );
    const patch = {};

    if (!uploadExists(community.logo)) patch.logo = logoUrl;
    if (!uploadExists(community.coverImage)) patch.coverImage = coverUrl;
    if (!uploadExists(community.photo_de_couverture)) patch.photo_de_couverture = coverUrl;

    if (Object.keys(patch).length > 0) {
      changed += 1;
      console.log(JSON.stringify({ id: community._id, slug: community.slug, patch }, null, 2));
      if (apply) {
        await mongoose.connection.db.collection('communities').updateOne({ _id: community._id }, { $set: patch });
      }
    }
  }

  console.log(`[audit-community-media] ${apply ? 'applied' : 'dry-run'} changes for ${changed} communities`);
  await mongoose.disconnect();
})();
