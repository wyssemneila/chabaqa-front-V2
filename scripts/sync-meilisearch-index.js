#!/usr/bin/env node
/**
 * Backfill Meilisearch index from MongoDB.
 * Usage: node scripts/sync-meilisearch-index.js
 * Requires: MEILI_HOST, MEILI_API_KEY (optional), MONGO_URI
 */
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env'), quiet: true });

const MEILI_HOST = (process.env.MEILI_HOST || 'http://127.0.0.1:7700').replace(/\/$/, '');
const MEILI_API_KEY = process.env.MEILI_API_KEY || process.env.MEILI_MASTER_KEY || '';
const INDEX = process.env.MEILI_GLOBAL_INDEX || 'chabaqa_content';
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chabaqa_local';

async function meiliFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (MEILI_API_KEY) headers.Authorization = `Bearer ${MEILI_API_KEY}`;
  const res = await fetch(`${MEILI_HOST}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`Meili ${path}: ${res.status} ${await res.text()}`);
  return res.json().catch(() => ({}));
}

function doc(id, type, title, description, extra = {}) {
  return { id: `${type}:${id}`, type, title: title || '', description: description || '', ...extra };
}

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();

  const documents = [];

  const communities = await db.collection('communities').find({ isActive: { $ne: false } }).project({ name: 1, slug: 1, description: 1 }).toArray();
  for (const c of communities) {
    documents.push(doc(String(c._id), 'community', c.name, c.description, { slug: c.slug }));
  }

  for (const coll of ['cours', 'courses']) {
    const courses = await db.collection(coll).find({ isPublished: { $ne: false } }).project({ title: 1, description: 1, slug: 1, communityId: 1 }).toArray();
    for (const c of courses) {
      documents.push(doc(String(c._id), 'course', c.title, c.description, { slug: c.slug, communityId: String(c.communityId || '') }));
    }
  }

  const products = await db.collection('products').find({ isActive: { $ne: false } }).project({ name: 1, description: 1, slug: 1, communityId: 1 }).toArray();
  for (const p of products) documents.push(doc(String(p._id), 'product', p.name, p.description, { slug: p.slug }));

  const events = await db.collection('events').find({ isPublished: { $ne: false } }).project({ title: 1, description: 1, slug: 1, communityId: 1 }).toArray();
  for (const e of events) documents.push(doc(String(e._id), 'event', e.title, e.description, { slug: e.slug }));

  const posts = await db.collection('posts').find({ status: 'published' }).project({ title: 1, content: 1, communityId: 1 }).limit(5000).toArray();
  for (const p of posts) documents.push(doc(String(p._id), 'post', p.title, String(p.content || '').slice(0, 500)));

  await meiliFetch(`/indexes/${INDEX}`, { method: 'PUT', body: JSON.stringify({ primaryKey: 'id' }) }).catch(() => undefined);
  if (documents.length === 0) {
    console.log('No documents to index');
    await client.close();
    return;
  }

  await meiliFetch(`/indexes/${INDEX}/documents`, {
    method: 'POST',
    body: JSON.stringify(documents),
  });

  console.log(`Indexed ${documents.length} documents into ${INDEX}`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
