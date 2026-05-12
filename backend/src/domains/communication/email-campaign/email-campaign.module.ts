import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailCampaign, EmailCampaignSchema } from '@/infrastructure/database/schemas/communication/email-campaign.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { CourseEnrollmentSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { UserLoginActivity, UserLoginActivitySchema } from '@/infrastructure/database/schemas/auth/user-login-activity.schema';
import { EmailCampaignController } from '@/domains/communication/email-campaign/email-campaign.controller';
import { EmailCampaignTrackingController } from '@/domains/communication/email-campaign/email-campaign-tracking.controller';
import { EmailCampaignService } from '@/domains/communication/email-campaign/email-campaign.service';
import { UserLoginActivityModule } from '@/domains/auth/user-login-activity/user-login-activity.module';
import { PolicyModule } from '@/shared/modules/policy.module';
import { EmailCampaignQueueService } from '@/domains/communication/email-campaign/email-campaign.queue';
import { EmailCampaignProcessor } from '@/domains/communication/email-campaign/email-campaign.processor';
import { EmailModule } from '@/domains/communication/email/email.module';

/**
 * Module for managing email campaigns including inactive user targeting
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailCampaign.name, schema: EmailCampaignSchema },
      { name: User.name, schema: UserSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: 'CourseEnrollment', schema: CourseEnrollmentSchema },
      { name: UserLoginActivity.name, schema: UserLoginActivitySchema },
    ]),
    UserLoginActivityModule,
    PolicyModule,
    EmailModule,
  ],
  controllers: [EmailCampaignController, EmailCampaignTrackingController],
  providers: [EmailCampaignService, EmailCampaignQueueService, EmailCampaignProcessor],
  exports: [EmailCampaignService, EmailCampaignQueueService],
})
export class EmailCampaignModule {}
