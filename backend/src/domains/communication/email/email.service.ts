import { Injectable, Logger } from '@nestjs/common';
import { EmailService as PlatformEmailService } from '@/shared/services/email.service';

export interface SessionBookingEmailData {
  sessionTitle: string;
  sessionDescription?: string;
  creatorName: string;
  creatorEmail: string;
  participantName: string;
  participantEmail: string;
  scheduledAt: Date;
  duration: number;
  meetingUrl?: string;
  bookingId: string;
  sessionId: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly platformEmailService: PlatformEmailService) {}

  async sendBookingConfirmation(data: SessionBookingEmailData): Promise<void> {
    const formatted = this.formatSessionDate(data.scheduledAt);
    const bodyHtml = `
      <p>Hi <strong>${this.escapeHtml(data.participantName)}</strong>,</p>
      <p>Great news. Your session booking has been confirmed.</p>
      ${data.sessionDescription ? `<p>${this.escapeHtml(data.sessionDescription)}</p>` : ''}
      <p>Prepare your questions, join a few minutes early, and keep this email handy.</p>
    `;

    await this.platformEmailService.sendSessionEmail({
      to: data.participantEmail,
      subject: `Session Booking Confirmation - ${data.sessionTitle}`,
      heading: 'Session Booking Confirmed',
      intro: 'Your session is officially on the calendar.',
      bodyHtml,
      accentColor: '#4F46E5',
      text: this.generateBookingConfirmationText(data),
      sessionTitle: data.sessionTitle,
      scheduledDate: formatted.date,
      scheduledTime: formatted.time,
      duration: data.duration,
      creatorName: data.creatorName,
      meetingUrl: data.meetingUrl,
    });

    this.logger.log(`Booking confirmation sent to ${data.participantEmail} for session ${data.sessionId}`);
  }

  async sendBookingNotificationToCreator(data: SessionBookingEmailData): Promise<void> {
    const formatted = this.formatSessionDate(data.scheduledAt);
    const bodyHtml = `
      <p>Hi <strong>${this.escapeHtml(data.creatorName)}</strong>,</p>
      <p>You have a new session booking.</p>
      <p>The participant has received a confirmation email. You can manage the booking from your creator dashboard.</p>
    `;

    await this.platformEmailService.sendSessionEmail({
      to: data.creatorEmail,
      subject: `New Session Booking - ${data.sessionTitle}`,
      heading: 'New Session Booking',
      intro: 'A participant booked time with you.',
      bodyHtml,
      accentColor: '#059669',
      text: this.generateCreatorNotificationText(data),
      sessionTitle: data.sessionTitle,
      scheduledDate: formatted.date,
      scheduledTime: formatted.time,
      duration: data.duration,
      participantName: data.participantName,
      meetingUrl: data.meetingUrl,
    });

    this.logger.log(`Booking notification sent to creator ${data.creatorEmail} for session ${data.sessionId}`);
  }

  async sendSessionReminder(data: SessionBookingEmailData): Promise<void> {
    const formatted = this.formatSessionDate(data.scheduledAt);
    const text = this.generateReminderText(data);
    const bodyHtml = `
      <p>Hi there,</p>
      <p>This is a friendly reminder about your upcoming session tomorrow.</p>
      <p>Test your camera and microphone, prepare your questions, and join five minutes early.</p>
    `;

    for (const to of [data.participantEmail, data.creatorEmail]) {
      await this.platformEmailService.sendSessionEmail({
        to,
        subject: `Session Reminder - ${data.sessionTitle} (Tomorrow)`,
        heading: 'Session Reminder',
        intro: 'Your session is coming up tomorrow.',
        bodyHtml,
        accentColor: '#F59E0B',
        text,
        sessionTitle: data.sessionTitle,
        scheduledDate: formatted.date,
        scheduledTime: formatted.time,
        duration: data.duration,
        meetingUrl: data.meetingUrl,
      });
    }

    this.logger.log(`Session reminder sent for session ${data.sessionId}`);
  }

  async sendCancellationNotification(
    data: SessionBookingEmailData,
    cancelledBy: 'creator' | 'participant',
    reason?: string,
  ): Promise<void> {
    const formatted = this.formatSessionDate(data.scheduledAt);
    const recipient = cancelledBy === 'creator' ? data.participantEmail : data.creatorEmail;
    const cancelledByName = cancelledBy === 'creator' ? data.creatorName : data.participantName;
    const bodyHtml = `
      <p>Hi there,</p>
      <p>The following session has been cancelled by <strong>${this.escapeHtml(cancelledByName)}</strong>.</p>
      <p>We apologize for any inconvenience. If you would like to reschedule, please coordinate a new time.</p>
    `;

    await this.platformEmailService.sendSessionEmail({
      to: recipient,
      subject: `Session Cancelled - ${data.sessionTitle}`,
      heading: 'Session Cancelled',
      intro: 'A scheduled session has been cancelled.',
      bodyHtml,
      accentColor: '#DC2626',
      text: this.generateCancellationText(data, cancelledBy, reason),
      sessionTitle: data.sessionTitle,
      scheduledDate: formatted.date,
      scheduledTime: formatted.time,
      duration: data.duration,
      reason,
    });

    this.logger.log(`Cancellation notification sent for session ${data.sessionId}`);
  }

  private formatSessionDate(date: Date): { date: string; time: string } {
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      }),
    };
  }

  private escapeHtml(value: string): string {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private generateBookingConfirmationText(data: SessionBookingEmailData): string {
    const formatted = this.formatSessionDate(data.scheduledAt);
    return [
      'Session Booking Confirmed!',
      '',
      `Hi ${data.participantName},`,
      `Session: ${data.sessionTitle}`,
      `Mentor: ${data.creatorName}`,
      `Date: ${formatted.date}`,
      `Time: ${formatted.time}`,
      `Duration: ${data.duration} minutes`,
      data.meetingUrl ? `Meeting Link: ${data.meetingUrl}` : 'Your mentor will provide meeting details if needed.',
    ].join('\n');
  }

  private generateCreatorNotificationText(data: SessionBookingEmailData): string {
    const formatted = this.formatSessionDate(data.scheduledAt);
    return [
      'New Session Booking!',
      '',
      `Hi ${data.creatorName},`,
      `Session: ${data.sessionTitle}`,
      `Participant: ${data.participantName}`,
      `Email: ${data.participantEmail}`,
      `Date: ${formatted.date}`,
      `Time: ${formatted.time}`,
      `Duration: ${data.duration} minutes`,
      data.meetingUrl ? `Meeting Link: ${data.meetingUrl}` : '',
    ].filter(Boolean).join('\n');
  }

  private generateReminderText(data: SessionBookingEmailData): string {
    const formatted = this.formatSessionDate(data.scheduledAt);
    return [
      'Session Reminder',
      '',
      `Session: ${data.sessionTitle}`,
      `Date: ${formatted.date}`,
      `Time: ${formatted.time}`,
      `Duration: ${data.duration} minutes`,
      data.meetingUrl ? `Meeting Link: ${data.meetingUrl}` : '',
      '',
      'Join five minutes early and make sure your camera and microphone are ready.',
    ].filter(Boolean).join('\n');
  }

  private generateCancellationText(
    data: SessionBookingEmailData,
    cancelledBy: 'creator' | 'participant',
    reason?: string,
  ): string {
    const formatted = this.formatSessionDate(data.scheduledAt);
    return [
      'Session Cancelled',
      '',
      `Session: ${data.sessionTitle}`,
      `Date: ${formatted.date}`,
      `Time: ${formatted.time}`,
      `Cancelled by: ${cancelledBy === 'creator' ? data.creatorName : data.participantName}`,
      reason ? `Reason: ${reason}` : '',
    ].filter(Boolean).join('\n');
  }
}
