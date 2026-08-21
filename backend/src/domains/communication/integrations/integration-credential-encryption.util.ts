import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 1;

export interface EncryptedIntegrationCredentials {
  __encrypted: true;
  v: number;
  iv: string;
  tag: string;
  data: string;
}

/**
 * Long-lived third-party credentials must not be tied to the JWT signing key:
 * rotating JWTs should not make creator integrations unrecoverable.  The key
 * is intentionally required only when an integration is connected/read.
 */
function integrationKey(): Buffer {
  const source = String(process.env.INTEGRATIONS_ENCRYPTION_KEY || '').trim();
  if (!source) {
    throw new Error('INTEGRATIONS_ENCRYPTION_KEY is required before connecting a third-party integration');
  }

  const key = /^[0-9a-f]{64}$/i.test(source)
    ? Buffer.from(source, 'hex')
    : Buffer.from(source, 'base64url');

  if (key.length !== 32) {
    throw new Error('INTEGRATIONS_ENCRYPTION_KEY must be a 32-byte base64url value or 64-character hexadecimal value');
  }
  return key;
}

export function encryptIntegrationCredentials<T>(value: T): EncryptedIntegrationCredentials {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, integrationKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value ?? null), 'utf8'),
    cipher.final(),
  ]);

  return {
    __encrypted: true,
    v: VERSION,
    iv: iv.toString('base64url'),
    tag: cipher.getAuthTag().toString('base64url'),
    data: encrypted.toString('base64url'),
  };
}

export function decryptIntegrationCredentials<T>(value: unknown): T | null {
  if (!value || typeof value !== 'object') return null;
  const encrypted = value as Partial<EncryptedIntegrationCredentials>;
  if (encrypted.__encrypted !== true || encrypted.v !== VERSION || !encrypted.iv || !encrypted.tag || !encrypted.data) {
    return null;
  }

  const decipher = createDecipheriv(ALGORITHM, integrationKey(), Buffer.from(encrypted.iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(encrypted.tag, 'base64url'));
  const cleartext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.data, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
  return JSON.parse(cleartext) as T;
}
