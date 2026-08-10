import { CreatorIntegrationsService } from './creator-integrations.service';

describe('CreatorIntegrationsService contract safety', () => {
  const service = new CreatorIntegrationsService(
    {} as any, {} as any, {} as any, {} as any, {} as any,
    {} as any, {} as any, {} as any, {} as any,
    { getRemainingQuota: jest.fn().mockResolvedValue(999999) } as any,
  );

  it('only advertises events that have production emitters', () => {
    expect(service.apiContract().events).toEqual([
      'member.joined', 'member.left', 'purchase.paid', 'purchase.refunded',
      'subscription.started', 'subscription.canceled', 'course.enrolled',
      'course.completed', 'challenge.joined', 'challenge.completed',
      'challenge.submitted', 'session.booked', 'session.canceled',
      'event.registered', 'post.created',
    ]);
  });

  it('documents no-follow redirects and HMAC idempotency headers', () => {
    const webhook = service.apiContract().webhook as any;
    expect(webhook.redirectPolicy).toContain('not followed');
    expect(webhook.headers['x-chabaqa-event-id']).toContain('idempotency');
    expect(webhook.successResponse).toContain('including 3xx');
  });

  it('recognizes loopback, private, and cloud metadata addresses', () => {
    const isPrivate = (service as any).isPrivateAddress.bind(service);
    for (const address of ['127.0.0.1', '10.0.0.1', '172.16.1.1', '192.168.1.1', '169.254.169.254', '::1', 'fc00::1', 'fe80::1']) {
      expect(isPrivate(address)).toBe(true);
    }
    expect(isPrivate('8.8.8.8')).toBe(false);
  });

  it('keeps external providers in setup-required state until their own secure connection succeeds', () => {
    const catalog = service.catalog() as any[];
    expect(catalog.find((item) => item.provider === 'google_sheets')?.status).toBe('setup_required');
    expect(catalog.find((item) => item.provider === 'kit')?.setup?.type).toBe('api_key');
    expect(catalog.find((item) => item.provider === 'discord')?.setup?.type).toBe('oauth_plus_bot');
  });

  it('only returns consent choices for the member community and an active mapped provider', async () => {
    const communityId = '64a1b2c3d4e5f6789abcdef0';
    const creatorId = '64a1b2c3d4e5f6789abcdef1';
    const memberId = '64a1b2c3d4e5f6789abcdef2';
    const query = (value: unknown) => ({ select: () => ({ lean: async () => value }) });
    const communityModel = {
      find: jest.fn(() => query([{ _id: communityId, name: 'Creator Launch Studio', slug: 'creator-launch-studio', createur: creatorId }])),
    };
    const integrationModel = {
      find: jest.fn(() => query([{
        creatorId,
        provider: 'kit',
        status: 'connected',
        config: { contactSyncEnabled: true, policyVersion: '2026-08' },
      }])),
    };
    const contactConsentModel = {
      find: jest.fn(() => query([{ communityId, provider: 'kit', consentedAt: new Date('2026-08-01') }])),
    };
    const consentService = new CreatorIntegrationsService(
      integrationModel as any, {} as any, {} as any, {} as any, communityModel as any,
      {} as any, contactConsentModel as any, {} as any, {} as any,
      { getRemainingQuota: jest.fn().mockResolvedValue(999999) } as any,
    );

    await expect(consentService.listContactConsentOptions(memberId)).resolves.toEqual([
      expect.objectContaining({
        communityId,
        communityName: 'Creator Launch Studio',
        provider: 'kit',
        policyVersion: '2026-08',
        granted: true,
      }),
    ]);
    expect(communityModel.find).toHaveBeenCalledWith({ members: expect.anything() });
    expect(integrationModel.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'connected' }));
  });

  it('exposes only active community contact-sync mappings to authenticated checkout', async () => {
    const communityId = '64a1b2c3d4e5f6789abcdef0';
    const creatorId = '64a1b2c3d4e5f6789abcdef1';
    const memberId = '64a1b2c3d4e5f6789abcdef2';
    const query = (value: unknown) => ({ select: () => ({ lean: async () => value }) });
    const communityModel = {
      findById: jest.fn(() => query({ _id: communityId, name: 'Integration Sandbox', slug: 'integration-sandbox', createur: creatorId, members: [] })),
    };
    const integrationModel = {
      find: jest.fn(() => query([{ provider: 'brevo', config: { contactSyncEnabled: true, policyVersion: '2026-08' } }])),
    };
    const contactConsentModel = { find: jest.fn(() => query([])) };
    const consentService = new CreatorIntegrationsService(
      integrationModel as any, {} as any, {} as any, {} as any, communityModel as any,
      {} as any, contactConsentModel as any, {} as any, {} as any,
      { getRemainingQuota: jest.fn().mockResolvedValue(999999) } as any,
    );

    await expect(consentService.listContactConsentOptionsForCommunity(memberId, communityId)).resolves.toEqual([
      expect.objectContaining({ provider: 'brevo', granted: false, policyVersion: '2026-08' }),
    ]);
  });

  it('reports retry exhaustion and credential failures for operational monitoring', async () => {
    const model = { countDocuments: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2) };
    const providerModel = { countDocuments: jest.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(4) };
    const oauthModel = { countDocuments: jest.fn().mockResolvedValueOnce(5) };
    const monitoringService = new CreatorIntegrationsService(
      {} as any, {} as any, model as any, {} as any, {} as any,
      oauthModel as any, {} as any, providerModel as any, {} as any,
      { getRemainingQuota: jest.fn().mockResolvedValue(999999) } as any,
    );

    await expect(monitoringService.getDeliveryStats()).resolves.toMatchObject({ retrying: 4, exhausted: 6, expiredOAuthStates: 5 });
  });
});
