import { MailerService } from '@nestjs-modules/mailer';
import { EmailService } from '@/shared/services/email.service';
import { EmailTemplateName } from '@/shared/services/email-template-names';

describe('EmailService template renderer', () => {
  let service: EmailService;
  let mailerService: { sendMail: jest.Mock };
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.IOS_APP_URL;
    delete process.env.ANDROID_APP_URL;
    delete process.env.EMAIL_UNSUBSCRIBE_URL;
    process.env.FRONTEND_URL = 'https://chabaqa.io';
    mailerService = { sendMail: jest.fn().mockResolvedValue({}) };
    service = new EmailService(mailerService as unknown as MailerService);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('sends registration OTP with the fixed OTP template', async () => {
    await service.sendRegistrationOtpEmail('user@test.com', '123456', 'Member');

    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@test.com',
        subject: 'Vérification de votre email - Chabaqa',
        template: EmailTemplateName.OTP,
        context: expect.objectContaining({
          userName: 'Member',
          otpCode: '123456',
          preferencesUrl: 'https://chabaqa.io/settings/notifications',
          showAppCta: false,
        }),
      }),
    );
  });

  it('escapes admin account notice values before rendering generic HTML', async () => {
    await service.sendAccountSuspensionEmail(
      'user@test.com',
      '<img src=x onerror=alert(1)>',
      '<script>alert(1)</script>',
    );

    const payload = mailerService.sendMail.mock.calls[0][0];
    expect(payload.template).toBe(EmailTemplateName.GENERIC);
    expect(payload.context.bodyHtml).toContain('&lt;img');
    expect(payload.context.bodyHtml).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(payload.context.bodyHtml).not.toContain('<script>alert(1)</script>');
  });

  it('adds env-driven footer and app links when configured', async () => {
    process.env.EMAIL_PREFERENCES_URL = 'https://chabaqa.io/prefs';
    process.env.EMAIL_UNSUBSCRIBE_URL = 'https://chabaqa.io/unsubscribe';
    process.env.IOS_APP_URL = 'https://apps.apple.com/chabaqa';

    await service.sendGenericEmail({
      to: 'user@test.com',
      subject: 'Hello',
      text: 'Body',
    });

    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          preferencesUrl: 'https://chabaqa.io/prefs',
          unsubscribeUrl: 'https://chabaqa.io/unsubscribe',
          iosAppUrl: 'https://apps.apple.com/chabaqa',
          showFooterDivider: true,
          showAppCta: true,
        }),
      }),
    );
  });

  it('sends event ticket with QR attachment and event template', async () => {
    await service.sendEventTicketEmail({
      to: 'buyer@test.com',
      userName: 'Buyer',
      eventTitle: 'Launch Day',
      eventDate: 'May 11, 2026',
      eventTime: '10:00 AM',
      eventType: 'online',
      ticketType: 'general',
      ticketName: 'General Admission',
      verifyUrl: 'https://chabaqa.io/ticket/verify/token',
      qrDataUrl: `data:image/png;base64,${Buffer.from('qr').toString('base64')}`,
    });

    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'buyer@test.com',
        template: EmailTemplateName.EVENT_TICKET,
        attachments: [
          expect.objectContaining({
            filename: 'ticket-qr.png',
            cid: 'ticket-qr',
          }),
        ],
      }),
    );
  });
});
