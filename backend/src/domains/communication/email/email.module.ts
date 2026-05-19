import { Global, Logger, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { MongooseModule } from '@nestjs/mongoose';
import * as nodemailer from 'nodemailer';
import { join } from 'path';
import { EmailService as PlatformEmailService } from '@/shared/services/email.service';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { Session, SessionSchema } from '@/infrastructure/database/schemas/commerce/session.schema';
import { EmailService } from '@/domains/communication/email/email.service';

const logger = new Logger('EmailModule');

function getEmailPassword(): string | undefined {
  const rawPassword =
    process.env.EMAIL_PASS ||
    process.env.EMAIL_PASSWORD ||
    process.env.SMTP_PASS ||
    process.env.EMAIL_APP_PASSWORD;
  const password = rawPassword?.trim();
  if (!password) return undefined;

  const host = String(process.env.EMAIL_HOST || '').toLowerCase();
  const service = String(process.env.EMAIL_SERVICE || '').toLowerCase();
  const shouldStripSpaces =
    /\s/.test(password) &&
    String(process.env.EMAIL_PASSWORD_STRIP_SPACES || '').toLowerCase() !== 'false' &&
    (host.includes('gmail') || service === 'gmail');

  if (!shouldStripSpaces) return password;

  const normalized = password.replace(/\s+/g, '');
  if (normalized !== password) {
    logger.warn('EMAIL_PASSWORD contained spaces and was normalized for Gmail App Password format.');
  }
  return normalized;
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM || 'noreply@chabaqa.io';
}

function getFromHeader(): string {
  return `"${process.env.EMAIL_FROM_NAME || 'Chabaqa'}" <${getFromAddress()}>`;
}

function getReplyToAddress(): string {
  return process.env.EMAIL_REPLY_TO || getFromAddress();
}

function isSmtpConfigured(): boolean {
  return Boolean((process.env.EMAIL_HOST || process.env.EMAIL_SERVICE) && process.env.EMAIL_USER && getEmailPassword());
}

function isEtherealFallbackAllowed(): boolean {
  const envValue = process.env.EMAIL_ALLOW_ETHEREAL_FALLBACK;
  if (envValue !== undefined) return envValue.toLowerCase() === 'true';
  return process.env.NODE_ENV !== 'production';
}

function buildSmtpTransportOptions(): any {
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = String(process.env.EMAIL_SECURE || '').toLowerCase() === 'true' || port === 465;
  const options: any = {
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER!,
      pass: getEmailPassword()!,
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2',
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  };

  if (process.env.EMAIL_HOST) options.host = process.env.EMAIL_HOST;
  if (process.env.EMAIL_SERVICE) options.service = process.env.EMAIL_SERVICE;

  return options;
}

async function createEtherealTransport(): Promise<any> {
  const testAccount = await nodemailer.createTestAccount();
  logger.log(`Using Ethereal Email fallback: ${testAccount.user}`);
  return {
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  };
}

async function resolveMailTransport(): Promise<any> {
  if (!isSmtpConfigured()) {
    if (isEtherealFallbackAllowed()) {
      logger.warn('SMTP is not configured. Using Ethereal Email fallback.');
      return createEtherealTransport();
    }

    logger.error('SMTP is not configured and Ethereal fallback is disabled.');
    return {
      host: process.env.EMAIL_HOST || '127.0.0.1',
      port: Number(process.env.EMAIL_PORT || 9),
      secure: false,
    };
  }

  const smtpOptions = buildSmtpTransportOptions();
  const smtpTransporter = nodemailer.createTransport(smtpOptions);
  try {
    await smtpTransporter.verify();
    logger.log('Email SMTP configured successfully.');
    return smtpOptions;
  } catch (error: any) {
    logger.error(`SMTP verification failed: ${error?.message || error}`);
    if (isEtherealFallbackAllowed()) {
      logger.warn('Switching to Ethereal Email fallback.');
      return createEtherealTransport();
    }
    return smtpOptions;
  }
}

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    MailerModule.forRootAsync({
      useFactory: async () => ({
        transport: await resolveMailTransport(),
        defaults: {
          from: getFromHeader(),
          replyTo: getReplyToAddress(),
        },
        template: {
          dir: join(__dirname, '..', 'email-templates', 'compiled'),
          adapter: new HandlebarsAdapter(undefined, {
            inlineCssEnabled: true,
          }),
          options: {
            strict: false,
          },
        },
      }),
    }),
  ],
  providers: [PlatformEmailService, EmailService],
  exports: [PlatformEmailService, EmailService, MailerModule],
})
export class EmailModule {}
