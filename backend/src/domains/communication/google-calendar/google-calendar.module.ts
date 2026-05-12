import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GoogleCalendarService } from '@/domains/communication/google-calendar/google-calendar.service';
import { GoogleCalendarController } from '@/domains/communication/google-calendar/google-calendar.controller';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { Session, SessionSchema } from '@/infrastructure/database/schemas/commerce/session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema }
    ])
  ],
  controllers: [GoogleCalendarController],
  providers: [GoogleCalendarService],
  exports: [GoogleCalendarService]
})
export class GoogleCalendarModule {}
