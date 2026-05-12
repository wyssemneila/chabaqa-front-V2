
import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { Notification, NotificationSchema } from '@/infrastructure/database/schemas/communication/notification.schema';
import { NotificationPreferences, NotificationPreferencesSchema } from '@/infrastructure/database/schemas/communication/notification-preferences.schema';
import { NotificationPreferenceItem, NotificationPreferenceItemSchema } from '@/infrastructure/database/schemas/communication/notification-preference-item.schema';
import { NotificationTemplate, NotificationTemplateSchema } from '@/infrastructure/database/schemas/communication/notification-template.schema';
import { PushSubscription, PushSubscriptionSchema } from '@/infrastructure/database/schemas/communication/push-subscription.schema';
import { NotificationMute, NotificationMuteSchema } from '@/infrastructure/database/schemas/communication/notification-mute.schema';
import { NotificationDedupeLog, NotificationDedupeLogSchema } from '@/infrastructure/database/schemas/communication/notification-dedupe-log.schema';
import { NotificationService } from '@/domains/communication/notification/notification.service';
import { NotificationController } from '@/domains/communication/notification/notification.controller';
import { NotificationGateway } from '@/domains/communication/notification/notification.gateway';
import { NotificationScheduler } from '@/domains/communication/notification/notification.scheduler';
import { NotificationRoutingService } from '@/domains/communication/notification/notification-routing.service';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { Event, EventSchema } from '@/infrastructure/database/schemas/commerce/event.schema';
import { EmailModule } from '@/domains/communication/email/email.module';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationPreferences.name, schema: NotificationPreferencesSchema },
      { name: NotificationPreferenceItem.name, schema: NotificationPreferenceItemSchema },
      { name: NotificationTemplate.name, schema: NotificationTemplateSchema },
      { name: PushSubscription.name, schema: PushSubscriptionSchema },
      { name: NotificationMute.name, schema: NotificationMuteSchema },
      { name: NotificationDedupeLog.name, schema: NotificationDedupeLogSchema },
      { name: User.name, schema: UserSchema },
      { name: Event.name, schema: EventSchema },
    ]),
    ScheduleModule.forRoot(),
    EmailModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway, NotificationScheduler, NotificationRoutingService],
  exports: [NotificationService],
})
export class NotificationModule {}
