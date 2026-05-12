import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { CommunityInvitationController } from '@/domains/community/invitation/community-invitation.controller';
import { CommunityInvitationService } from '@/domains/community/invitation/community-invitation.service';
import {
  CommunityInvitation,
  CommunityInvitationSchema,
} from '@/infrastructure/database/schemas/community/community-invitation.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { EmailService } from '@/shared/services/email.service';
import { AuthModule } from '@/domains/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CommunityInvitation.name, schema: CommunityInvitationSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: User.name, schema: UserSchema },
    ]),
    ScheduleModule.forRoot(),
    AuthModule,
  ],
  controllers: [CommunityInvitationController],
  providers: [CommunityInvitationService, EmailService],
  exports: [CommunityInvitationService],
})
export class CommunityInvitationModule {}
