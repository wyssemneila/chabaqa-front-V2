import { existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

const DEFAULT_UPLOAD_PATH = 'uploads';

export function getConfiguredUploadPath(): string {
  return process.env.UPLOAD_PATH || DEFAULT_UPLOAD_PATH;
}

export function resolveUploadsRoot(): string {
  return resolve(process.cwd(), getConfiguredUploadPath());
}

export function resolveUploadTypeDir(segment: string): string {
  return join(resolveUploadsRoot(), segment);
}

export function ensureUploadDirectories(): void {
  const root = resolveUploadsRoot();
  const requiredDirs = [
    root,
    resolveUploadTypeDir('image'),
    resolveUploadTypeDir('video'),
    resolveUploadTypeDir('document'),
    resolveUploadTypeDir('audio'),
  ];

  for (const dir of requiredDirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}
