import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventService } from '@/domains/commerce/event/event.service';
import { EventController } from '@/domains/commerce/event/event.controller';
import { Event, EventSchema } from '@/infrastructure/database/schemas/commerce/event.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { AuthModule } from '@/domains/auth/auth.module';
import { FeeModule } from '@/shared/modules/fee.module';
import { OrderSchema } from '@/infrastructure/database/schemas/commerce/order.schema';
import { PolicyModule } from '@/shared/modules/policy.module';
import { PromoModule } from '@/shared/modules/promo.module';
import { TrackingModule } from '@/shared/modules/tracking.module';
import { EmailModule } from '@/domains/communication/email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: User.name, schema: UserSchema },
      { name: 'Order', schema: OrderSchema }
    ]),
    AuthModule,
    FeeModule,
    PolicyModule,
    PromoModule,
    TrackingModule,
    EmailModule
  ],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService]
})
export class EventModule {}

