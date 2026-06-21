import axios from 'axios';
import { ServiceUnavailableException } from '@nestjs/common';
import { OpenWaClientService } from '@/domains/communication/whatsapp/openwa-client.service';

jest.mock('axios');

describe('OpenWaClientService', () => {
  const request = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (axios.create as jest.Mock).mockReturnValue({ request });
    process.env.WHATSAPP_ENABLED = 'true';
    process.env.OPENWA_API_KEY = 'owa_test_key';
    process.env.OPENWA_BASE_URL = 'http://openwa.test/api';
  });

  afterEach(() => {
    delete process.env.WHATSAPP_ENABLED;
    delete process.env.OPENWA_API_KEY;
    delete process.env.OPENWA_BASE_URL;
  });

  it('normalizes E.164 phone numbers into OpenWA chat ids', () => {
    const service = new OpenWaClientService();
    expect(service.normalizePhoneToChatId('+216 50 123 456')).toBe('21650123456@c.us');
  });

  it('adds the OpenWA API key when creating a session', async () => {
    request.mockResolvedValueOnce({ data: { id: 'session-1', name: 'community' } });
    const service = new OpenWaClientService();

    await expect(service.createSession('community')).resolves.toEqual({ id: 'session-1', name: 'community' });
    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      method: 'POST',
      url: '/sessions',
      data: { name: 'community' },
      headers: expect.objectContaining({ 'X-API-Key': 'owa_test_key' }),
    }));
  });

  it('fails closed when WhatsApp is disabled', async () => {
    process.env.WHATSAPP_ENABLED = 'false';
    const service = new OpenWaClientService();

    await expect(service.createSession('community')).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(request).not.toHaveBeenCalled();
  });
});
