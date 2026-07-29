import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import {
  WhatsappAutomation,
  WhatsappAutomationSchema,
} from '@/infrastructure/database/schemas/communication/whatsapp-automation.schema';
import {
  WhatsappCampaign,
  WhatsappCampaignSchema,
} from '@/infrastructure/database/schemas/communication/whatsapp-campaign.schema';
import {
  WhatsappContact,
  WhatsappContactSchema,
} from '@/infrastructure/database/schemas/communication/whatsapp-contact.schema';
import {
  WhatsappSession,
  WhatsappSessionSchema,
} from '@/infrastructure/database/schemas/communication/whatsapp-session.schema';
import {
  WhatsappTemplate,
  WhatsappTemplateSchema,
} from '@/infrastructure/database/schemas/communication/whatsapp-template.schema';
import {
  WhatsappWebhookEvent,
  WhatsappWebhookEventSchema,
} from '@/infrastructure/database/schemas/communication/whatsapp-webhook-event.schema';
import { PolicyModule } from '@/shared/modules/policy.module';
import { SecurityModule } from '@/shared/modules/security.module';
import { OpenWaClientService } from '@/domains/communication/whatsapp/openwa-client.service';
import { WhatsappAiService } from '@/domains/communication/whatsapp/whatsapp-ai.service';
import { WhatsappAudienceService } from '@/domains/communication/whatsapp/whatsapp-audience.service';
import { WhatsappController } from '@/domains/communication/whatsapp/whatsapp.controller';
import { WhatsappProcessor } from '@/domains/communication/whatsapp/whatsapp.processor';
import { WhatsappQueueService } from '@/domains/communication/whatsapp/whatsapp.queue';
import { WhatsappService } from '@/domains/communication/whatsapp/whatsapp.service';
import { WhatsappSessionController } from '@/domains/communication/whatsapp/whatsapp-session.controller';
import { WhatsappSessionService } from '@/domains/communication/whatsapp/whatsapp-session.service';
import { WhatsappWebhookController } from '@/domains/communication/whatsapp/whatsapp-webhook.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Community.name, schema: CommunitySchema },
      { name: WhatsappAutomation.name, schema: WhatsappAutomationSchema },
      { name: WhatsappCampaign.name, schema: WhatsappCampaignSchema },
      { name: WhatsappContact.name, schema: WhatsappContactSchema },
      { name: WhatsappSession.name, schema: WhatsappSessionSchema },
      { name: WhatsappTemplate.name, schema: WhatsappTemplateSchema },
      { name: WhatsappWebhookEvent.name, schema: WhatsappWebhookEventSchema },
    ]),
    PolicyModule,
    SecurityModule,
  ],
  controllers: [WhatsappController, WhatsappSessionController, WhatsappWebhookController],
  providers: [
    OpenWaClientService,
    WhatsappAiService,
    WhatsappAudienceService,
    WhatsappProcessor,
    WhatsappQueueService,
    WhatsappService,
    WhatsappSessionService,
  ],
  exports: [WhatsappService, WhatsappSessionService, WhatsappAiService],
})
export class WhatsappModule {}
