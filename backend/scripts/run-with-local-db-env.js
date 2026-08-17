#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const dotenv = require('dotenv');

const rootDir = path.join(__dirname, '..');
const baseEnvPath = path.join(rootDir, '.env');
const localEnvPath = path.join(rootDir, '.env.local-db');

if (fs.existsSync(baseEnvPath)) {
  dotenv.config({ path: baseEnvPath, quiet: true });
}

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath, override: true, quiet: true });
}

const replaceHost = (value, serviceName) =>
  typeof value === 'string'
    ? value
        .replace(`://${serviceName}:`, '://127.0.0.1:')
        .replace(`@${serviceName}:`, '@127.0.0.1:')
    : value;

process.env.MONGO_URI = replaceHost(process.env.MONGO_URI, 'mongo');
process.env.MONGODB_URI = replaceHost(process.env.MONGODB_URI, 'mongo');
process.env.REDIS_URL = replaceHost(process.env.REDIS_URL, 'redis');
process.env.SOCKET_IO_REDIS_URL = replaceHost(process.env.SOCKET_IO_REDIS_URL, 'redis');
process.env.S3_ENDPOINT = replaceHost(process.env.S3_ENDPOINT, 'minio');

if (process.env.REDIS_HOST === 'redis') process.env.REDIS_HOST = '127.0.0.1';
if (process.env.CLAMAV_HOST === 'clamav') process.env.CLAMAV_HOST = '127.0.0.1';

const [command, ...args] = process.argv.slice(2);
const pathKey = Object.keys(process.env).find(key => key.toLowerCase() === 'path') || 'PATH';
const localBinDir = path.join(rootDir, 'node_modules', '.bin');

if (!command) {
  console.error(
    '[ERROR] Missing command. Usage: node scripts/run-with-local-db-env.js <command> [args...]',
  );
  process.exit(1);
}

const child = spawn(command, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    [pathKey]: `${localBinDir}${path.delimiter}${process.env[pathKey] || ''}`,
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error(`[ERROR] Failed to start command "${command}":`, error.message);
  process.exit(1);
});
