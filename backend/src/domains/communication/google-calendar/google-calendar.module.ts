import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GoogleCalendarService } from '@/domains/communication/google-calendar/google-calendar.service';
import { GoogleCalendarController } from '@/domains/communication/google-calendar/google-calendar.controller';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { Session, SessionSchema } from '@/infrastructure/database/schemas/commerce/session.schema';
import { GoogleCalendarOAuthState, GoogleCalendarOAuthStateSchema } from '@/infrastructure/database/schemas/communication/google-calendar-oauth-state.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
       { name: Session.name, schema: SessionSchema },
       { name: GoogleCalendarOAuthState.name, schema: GoogleCalendarOAuthStateSchema }
    ])
  ],
  controllers: [GoogleCalendarController],
  providers: [GoogleCalendarService],
  exports: [GoogleCalendarService]
})
export class GoogleCalendarModule {}
