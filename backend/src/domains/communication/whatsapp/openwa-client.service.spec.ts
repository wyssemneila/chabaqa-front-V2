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
    expect(service.normalizePhoneToChatId('+216 50 123 456')).toBe(
      '21650123456@c.us',
    );
  });

  it('adds the OpenWA API key when creating a session', async () => {
    request.mockResolvedValueOnce({
      data: { id: 'session-1', name: 'community' },
    });
    const service = new OpenWaClientService();

    await expect(service.createSession('community')).resolves.toEqual({
      id: 'session-1',
      name: 'community',
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/sessions',
        data: { name: 'community' },
        headers: expect.objectContaining({ 'X-API-Key': 'owa_test_key' }),
      }),
    );
  });

  it('smoke tests OpenWA session, QR, pairing, message, media, webhook and health API calls', async () => {
    request
      .mockResolvedValueOnce({ data: { id: 'session-1', status: 'starting' } })
      .mockResolvedValueOnce({ data: { qrCode: 'qr-data' } })
      .mockResolvedValueOnce({ data: { pairingCode: '12345678' } })
      .mockResolvedValueOnce({ data: { messageId: 'msg-text' } })
      .mockResolvedValueOnce({ data: { messageId: 'msg-media' } })
      .mockResolvedValueOnce({ data: { ok: true } })
      .mockResolvedValueOnce({ data: [] });
    const service = new OpenWaClientService();

    await expect(service.startSession('session-1')).resolves.toEqual({
      id: 'session-1',
      status: 'starting',
    });
    await expect(service.getQr('session-1')).resolves.toEqual({
      qrCode: 'qr-data',
    });
    await expect(
      service.requestPairingCode('session-1', '21650123456'),
    ).resolves.toEqual({ pairingCode: '12345678' });
    await expect(
      service.sendText('session-1', '21650123456@c.us', 'Hello'),
    ).resolves.toEqual({
      id: 'msg-text',
      messageId: 'msg-text',
      status: undefined,
      raw: { messageId: 'msg-text' },
    });
    await expect(
      service.sendMedia('session-1', 'image', {
        chatId: '21650123456@c.us',
        mediaUrl: 'https://cdn.example.com/image.jpg',
        caption: 'Image',
      }),
    ).resolves.toEqual({
      id: 'msg-media',
      messageId: 'msg-media',
      status: undefined,
      raw: { messageId: 'msg-media' },
    });
    await expect(
      service.createWebhook('session-1', {
        url: 'https://app.example.com/api/whatsapp/openwa/webhook',
        secret: 'secret',
      }),
    ).resolves.toEqual({ ok: true });
    await expect(service.health()).resolves.toEqual({
      enabled: true,
      reachable: true,
      authenticated: true,
    });

    expect(request).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        method: 'POST',
        url: '/sessions/session-1/start',
        headers: expect.objectContaining({ 'X-API-Key': 'owa_test_key' }),
      }),
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        method: 'GET',
        url: '/sessions/session-1/qr',
      }),
    );
    expect(request).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        method: 'POST',
        url: '/sessions/session-1/pairing-code',
        data: { phoneNumber: '21650123456' },
      }),
    );
    expect(request).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        method: 'POST',
        url: '/sessions/session-1/messages/send-text',
        data: { chatId: '21650123456@c.us', text: 'Hello' },
      }),
    );
    expect(request).toHaveBeenNthCalledWith(
      5,
      expect.objectContaining({
        method: 'POST',
        url: '/sessions/session-1/messages/send-image',
      }),
    );
    expect(request).toHaveBeenNthCalledWith(
      6,
      expect.objectContaining({
        method: 'POST',
        url: '/sessions/session-1/webhooks',
        data: expect.objectContaining({
          url: 'https://app.example.com/api/whatsapp/openwa/webhook',
          secret: 'secret',
          events: expect.arrayContaining([
            'message.ack',
            'session.authenticated',
          ]),
        }),
      }),
    );
    expect(request).toHaveBeenNthCalledWith(
      7,
      expect.objectContaining({
        method: 'GET',
        url: '/sessions',
      }),
    );
  });

  it('fails closed when WhatsApp is disabled', async () => {
    process.env.WHATSAPP_ENABLED = 'false';
    const service = new OpenWaClientService();

    await expect(service.createSession('community')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(request).not.toHaveBeenCalled();
  });
});
