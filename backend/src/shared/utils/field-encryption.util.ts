import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { getJwtSecret } from '@/shared/utils/security-config.util';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 1;

export interface EncryptedFieldPayload {
  __encrypted: true;
  v: number;
  iv: string;
  tag: string;
  data: string;
}

function getEncryptionKey(): Buffer {
  const source = process.env.FIELD_ENCRYPTION_KEY || getJwtSecret();
  return createHash('sha256').update(source).digest();
}

export function encryptFieldValue<T>(value: T): EncryptedFieldPayload {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const plaintext = JSON.stringify(value ?? null);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

  return {
    __encrypted: true,
    v: VERSION,
    iv: iv.toString('base64url'),
    tag: cipher.getAuthTag().toString('base64url'),
    data: encrypted.toString('base64url'),
  };
}

export function decryptFieldValue<T>(value: unknown): T | null {
  if (!value || typeof value !== 'object') return null;

  const payload = value as Partial<EncryptedFieldPayload>;
  if (payload.__encrypted !== true) {
    return value as T;
  }

  if (!payload.iv || !payload.tag || !payload.data) {
    return null;
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(payload.iv, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64url'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.data, 'base64url')),
    decipher.final(),
  ]).toString('utf8');

  return JSON.parse(decrypted) as T;
}
