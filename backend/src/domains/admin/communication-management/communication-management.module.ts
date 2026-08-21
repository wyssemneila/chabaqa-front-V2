import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunicationManagementController } from '@/domains/admin/communication-management/communication-management.controller';
import { CommunicationManagementService } from '@/domains/admin/communication-management/communication-management.service';
import {
  EmailCampaign,
  EmailCampaignSchema,
} from '@/infrastructure/database/schemas/communication/email-campaign.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import {
  Notification,
  NotificationSchema,
} from '@/infrastructure/database/schemas/communication/notification.schema';
import {
  NotificationConfig,
  NotificationConfigSchema,
} from '@/domains/admin/schemas/notification-config.schema';
import {
  EmailTemplate,
  EmailTemplateSchema,
} from '@/domains/admin/schemas/email-template.schema';
import { EmailService } from '@/shared/services/email.service';
import { NotificationModule } from '@/domains/communication/notification/notification.module';
import { AuditLogService } from '@/domains/admin/common/services/audit-log.service';
import { AuditLog, AuditLogSchema } from '@/domains/admin/schemas/audit-log.schema';
import { AdminUser, AdminUserSchema } from '@/domains/admin/schemas/admin-user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailCampaign.name, schema: EmailCampaignSchema },
      { name: User.name, schema: UserSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationConfig.name, schema: NotificationConfigSchema },
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: AdminUser.name, schema: AdminUserSchema },
    ]),
    NotificationModule,
  ],
  controllers: [CommunicationManagementController],
  providers: [
    CommunicationManagementService,
    EmailService,
    AuditLogService,
  ],
  exports: [CommunicationManagementService],
})
export class CommunicationManagementModule {}
