#!/usr/bin/env node

const { createReadStream, promises: fs } = require('fs');
const path = require('path');
const { HeadObjectCommand, PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');

const repoRoot = path.resolve(__dirname, '..', '..');
const uploadsRoot = path.resolve(process.env.UPLOAD_PATH || path.join(repoRoot, 'backend/uploads'));
const dryRun = process.argv.includes('--dry-run');

const endpoint = process.env.S3_ENDPOINT || process.env.AWS_S3_ENDPOINT || 'http://127.0.0.1:9000';
const region = process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1';
const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || 'chabaqa-media';
const accessKeyId = process.env.S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || process.env.MINIO_ROOT_USER;
const secretAccessKey = process.env.S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || process.env.MINIO_ROOT_PASSWORD;

if (!accessKeyId || !secretAccessKey) {
  console.error('Missing S3 credentials. Set S3_ACCESS_KEY/S3_SECRET_KEY or MINIO_ROOT_USER/MINIO_ROOT_PASSWORD.');
  process.exit(1);
}

const client = new S3Client({
  endpoint,
  region,
  forcePathStyle: (process.env.S3_FORCE_PATH_STYLE || 'true') !== 'false',
  credentials: { accessKeyId, secretAccessKey },
});

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

function contentTypeFor(file) {
  const ext = path.extname(file).toLowerCase();
  return {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.pdf': 'application/pdf',
    '.json': 'application/json',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
  }[ext] || 'application/octet-stream';
}

async function objectSize(key) {
  try {
    const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return result.ContentLength;
  } catch {
    return null;
  }
}

async function main() {
  const files = (await walk(uploadsRoot))
    .filter((file) => !path.relative(uploadsRoot, file).split(path.sep).join('/').startsWith('quarantine/'));
  const result = {
    dryRun,
    endpoint,
    bucket,
    uploadsRoot,
    totalFiles: files.length,
    uploaded: 0,
    skippedExisting: 0,
    failed: 0,
    failures: [],
  };

  for (const file of files) {
    const key = path.relative(uploadsRoot, file).split(path.sep).join('/');
    const stat = await fs.stat(file);
    const existingSize = await objectSize(key);
    if (existingSize === stat.size) {
      result.skippedExisting += 1;
      continue;
    }
    if (dryRun) continue;
    try {
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: createReadStream(file),
        ContentType: contentTypeFor(file),
      }));
      const uploadedSize = await objectSize(key);
      if (uploadedSize !== stat.size) {
        throw new Error(`size mismatch after upload: disk=${stat.size}, object=${uploadedSize}`);
      }
      result.uploaded += 1;
    } catch (error) {
      result.failed += 1;
      result.failures.push({ key, message: error.message });
    }
  }

  const outDir = path.join(repoRoot, 'storage/reports');
  await fs.mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, `object-storage-migration-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await fs.writeFile(outFile, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ report: outFile, ...result, failures: result.failures.slice(0, 10) }, null, 2));
  if (result.failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
