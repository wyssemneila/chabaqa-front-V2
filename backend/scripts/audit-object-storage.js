#!/usr/bin/env node

const { createHash } = require('crypto');
const { existsSync, promises: fs } = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { HeadObjectCommand, S3Client } = require('@aws-sdk/client-s3');

const repoRoot = path.resolve(__dirname, '..', '..');
const uploadsRoot = path.resolve(process.env.UPLOAD_PATH || path.join(repoRoot, 'backend/uploads'));
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chabaqa_local';
const dbName = process.env.MONGO_DB_NAME || new URL(mongoUri).pathname.replace(/^\//, '') || 'chabaqa_local';
const s3Endpoint = process.env.S3_ENDPOINT || process.env.AWS_S3_ENDPOINT || '';
const s3Bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || 'chabaqa-media';
const s3Region = process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1';
const s3AccessKey = process.env.S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || process.env.MINIO_ROOT_USER || '';
const s3SecretKey = process.env.S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || process.env.MINIO_ROOT_PASSWORD || '';
const s3Configured = Boolean(s3Endpoint && s3Bucket && s3AccessKey && s3SecretKey);
const s3Client = s3Configured
  ? new S3Client({
      endpoint: s3Endpoint,
      region: s3Region,
      forcePathStyle: (process.env.S3_FORCE_PATH_STYLE || 'true') !== 'false',
      credentials: { accessKeyId: s3AccessKey, secretAccessKey: s3SecretKey },
    })
  : null;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    if (entry.isFile()) files.push(full);
  }
  return files;
}

async function sha256(file) {
  const hash = createHash('sha256');
  const handle = await fs.open(file, 'r');
  try {
    for await (const chunk of handle.createReadStream()) hash.update(chunk);
  } finally {
    await handle.close();
  }
  return hash.digest('hex');
}

async function objectExists(storageKey) {
  if (!s3Client) return false;
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: s3Bucket, Key: storageKey }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(dbName);

  const diskFiles = await walk(uploadsRoot);
  const disk = [];
  for (const file of diskFiles) {
    const stat = await fs.stat(file);
    const storageKey = path.relative(uploadsRoot, file).split(path.sep).join('/');
    disk.push({
      storageKey,
      path: file,
      size: stat.size,
      sha256: await sha256(file),
    });
  }

  const mediaAssets = await db.collection('mediaassets')
    .find({ status: { $ne: 'deleted' } }, { projection: { storageKey: 1, url: 1, mediaType: 1, size: 1, status: 1 } })
    .toArray();

  const diskKeys = new Set(disk.map((file) => file.storageKey));
  const mediaKeys = new Set(mediaAssets.map((asset) => asset.storageKey).filter(Boolean));
  const candidateObjectKeys = [...new Set([...diskKeys, ...mediaKeys]
    .filter(Boolean)
    .filter((storageKey) => !storageKey.startsWith('quarantine/')))];
  const objectStorage = {
    configured: s3Configured,
    endpoint: s3Configured ? s3Endpoint : null,
    bucket: s3Configured ? s3Bucket : null,
    checkedKeys: s3Configured ? candidateObjectKeys.length : 0,
    present: 0,
    missing: [],
  };
  if (s3Configured) {
    for (const storageKey of candidateObjectKeys) {
      if (await objectExists(storageKey)) {
        objectStorage.present += 1;
      } else {
        objectStorage.missing.push(storageKey);
      }
    }
  }
  const missingOnDisk = mediaAssets
    .filter((asset) => asset.storageKey && !diskKeys.has(asset.storageKey))
    .map((asset) => ({
      assetId: String(asset._id),
      storageKey: asset.storageKey,
      url: asset.url,
      mediaType: asset.mediaType,
      size: asset.size,
    }));
  const untrackedDiskFiles = disk
    .filter((file) => !mediaKeys.has(file.storageKey) && !file.storageKey.startsWith('quarantine/'))
    .map((file) => ({ storageKey: file.storageKey, size: file.size, sha256: file.sha256 }));

  const report = {
    generatedAt: new Date().toISOString(),
    uploadsRoot,
    totals: {
      diskFiles: disk.length,
      diskBytes: disk.reduce((sum, file) => sum + file.size, 0),
      mediaAssets: mediaAssets.length,
      mediaAssetsPresentOnDisk: mediaAssets.length - missingOnDisk.length,
      mediaAssetsMissingOnDisk: missingOnDisk.length,
      untrackedDiskFiles: untrackedDiskFiles.length,
      objectStorageCheckedKeys: objectStorage.checkedKeys,
      objectStoragePresent: objectStorage.present,
      objectStorageMissing: objectStorage.missing.length,
    },
    byTopLevelFolder: disk.reduce((acc, file) => {
      const folder = file.storageKey.split('/')[0] || '.';
      acc[folder] = (acc[folder] || 0) + 1;
      return acc;
    }, {}),
    missingOnDisk,
    untrackedDiskFiles,
    objectStorage,
    disk,
  };

  const outDir = path.join(repoRoot, 'storage/reports');
  await fs.mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, `object-storage-audit-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await fs.writeFile(outFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ report: outFile, totals: report.totals, byTopLevelFolder: report.byTopLevelFolder }, null, 2));
  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
