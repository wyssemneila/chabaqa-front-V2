import {
  decryptIntegrationCredentials,
  encryptIntegrationCredentials,
} from './integration-credential-encryption.util';

describe('integration credential encryption', () => {
  const original = process.env.INTEGRATIONS_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.INTEGRATIONS_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64url');
  });

  afterAll(() => {
    if (original === undefined) delete process.env.INTEGRATIONS_ENCRYPTION_KEY;
    else process.env.INTEGRATIONS_ENCRYPTION_KEY = original;
  });

  it('round-trips credentials without keeping plaintext in the stored payload', () => {
    const cleartext = { accessToken: 'access-token', refreshToken: 'refresh-token' };
    const encrypted = encryptIntegrationCredentials(cleartext);
    expect(JSON.stringify(encrypted)).not.toContain('access-token');
    expect(decryptIntegrationCredentials<typeof cleartext>(encrypted)).toEqual(cleartext);
  });

  it('rejects missing or incorrectly sized encryption keys', () => {
    delete process.env.INTEGRATIONS_ENCRYPTION_KEY;
    expect(() => encryptIntegrationCredentials({ token: 'x' })).toThrow('INTEGRATIONS_ENCRYPTION_KEY');
    process.env.INTEGRATIONS_ENCRYPTION_KEY = 'too-short';
    expect(() => encryptIntegrationCredentials({ token: 'x' })).toThrow('32-byte');
  });
});
