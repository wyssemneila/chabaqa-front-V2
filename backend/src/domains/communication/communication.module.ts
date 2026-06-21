import { Module } from '@nestjs/common';
import { EmailModule } from '@/domains/communication/email/email.module';
import { EmailCampaignModule } from '@/domains/communication/email-campaign/email-campaign.module';
import { NotificationModule } from '@/domains/communication/notification/notification.module';
import { DmModule } from '@/domains/communication/dm/dm.module';
import { LiveSupportModule } from '@/domains/communication/live-support/live-support.module';
import { GoogleCalendarModule } from '@/domains/communication/google-calendar/google-calendar.module';
import { WhatsappModule } from '@/domains/communication/whatsapp/whatsapp.module';

@Module({
  imports: [EmailModule, EmailCampaignModule, NotificationModule, DmModule, LiveSupportModule, GoogleCalendarModule, WhatsappModule],
  exports: [EmailModule, EmailCampaignModule, NotificationModule, DmModule, LiveSupportModule, GoogleCalendarModule, WhatsappModule],
})
export class CommunicationModule {}
