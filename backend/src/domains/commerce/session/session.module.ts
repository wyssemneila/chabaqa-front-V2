import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionController } from '@/domains/commerce/session/session.controller';
import { SessionService } from '@/domains/commerce/session/session.service';
import { Session, SessionSchema } from '@/infrastructure/database/schemas/commerce/session.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { AuthModule } from '@/domains/auth/auth.module';
import { TrackingModule } from '@/shared/modules/tracking.module';
import { FeeModule } from '@/shared/modules/fee.module';
import { OrderSchema } from '@/infrastructure/database/schemas/commerce/order.schema';
import { PolicyModule } from '@/shared/modules/policy.module';
import { PromoModule } from '@/shared/modules/promo.module';
import { GoogleCalendarModule } from '@/domains/communication/google-calendar/google-calendar.module';
import { EmailModule } from '@/domains/communication/email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: User.name, schema: UserSchema },
      { name: 'Order', schema: OrderSchema },
    ]),
    AuthModule,
    TrackingModule,
    FeeModule,
    PolicyModule,
    PromoModule,
    GoogleCalendarModule,
    EmailModule,
  ],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
