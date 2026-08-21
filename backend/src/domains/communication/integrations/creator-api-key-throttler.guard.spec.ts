import { createHash } from 'crypto';
import { CreatorApiKeyThrottlerGuard } from './creator-api-key-throttler.guard';

describe('CreatorApiKeyThrottlerGuard', () => {
  const guard = new CreatorApiKeyThrottlerGuard({} as any, {} as any, {} as any);
  const trackerFor = (request: any) => (guard as any).getTracker(request);

  it('uses a non-reversible digest for each creator API key', async () => {
    const raw = 'chq_example_secret_value';
    const tracker = await trackerFor({ headers: { 'x-chabaqa-api-key': raw }, ip: '203.0.113.10' });
    expect(tracker).toBe(`creator-api-key:${createHash('sha256').update(raw).digest('hex')}`);
    expect(tracker).not.toContain(raw);
  });

  it('gives distinct API keys independent buckets and falls back to IP', async () => {
    const first = await trackerFor({ headers: { 'x-chabaqa-api-key': 'chq_first' }, ip: '203.0.113.10' });
    const second = await trackerFor({ headers: { 'x-chabaqa-api-key': 'chq_second' }, ip: '203.0.113.10' });
    const anonymous = await trackerFor({ headers: {}, ip: '203.0.113.10' });
    expect(first).not.toBe(second);
    expect(anonymous).toBe('creator-api-ip:203.0.113.10');
  });
});
