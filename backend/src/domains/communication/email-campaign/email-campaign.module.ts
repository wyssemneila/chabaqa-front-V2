import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailCampaign, EmailCampaignSchema } from '@/infrastructure/database/schemas/communication/email-campaign.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { Challenge, ChallengeSchema } from '@/infrastructure/database/schemas/learning/challenge.schema';
import { Cours, CourseEnrollmentSchema, CoursSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { Event, EventSchema } from '@/infrastructure/database/schemas/commerce/event.schema';
import { Product, ProductSchema } from '@/infrastructure/database/schemas/commerce/product.schema';
import { Session, SessionSchema } from '@/infrastructure/database/schemas/commerce/session.schema';
import { UserLoginActivity, UserLoginActivitySchema } from '@/infrastructure/database/schemas/auth/user-login-activity.schema';
import { EmailCampaignController } from '@/domains/communication/email-campaign/email-campaign.controller';
import { EmailCampaignTrackingController } from '@/domains/communication/email-campaign/email-campaign-tracking.controller';
import { EmailCampaignService } from '@/domains/communication/email-campaign/email-campaign.service';
import { UserLoginActivityModule } from '@/domains/auth/user-login-activity/user-login-activity.module';
import { PolicyModule } from '@/shared/modules/policy.module';
import { EmailCampaignQueueService } from '@/domains/communication/email-campaign/email-campaign.queue';
import { EmailCampaignProcessor } from '@/domains/communication/email-campaign/email-campaign.processor';
import { EmailModule } from '@/domains/communication/email/email.module';
import { SecurityModule } from '@/shared/modules/security.module';

/**
 * Module for managing email campaigns including inactive user targeting
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailCampaign.name, schema: EmailCampaignSchema },
      { name: User.name, schema: UserSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: Cours.name, schema: CoursSchema },
      { name: Challenge.name, schema: ChallengeSchema },
      { name: Event.name, schema: EventSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Session.name, schema: SessionSchema },
      { name: 'CourseEnrollment', schema: CourseEnrollmentSchema },
      { name: UserLoginActivity.name, schema: UserLoginActivitySchema },
    ]),
    UserLoginActivityModule,
    PolicyModule,
    EmailModule,
    SecurityModule,
  ],
  controllers: [EmailCampaignController, EmailCampaignTrackingController],
  providers: [EmailCampaignService, EmailCampaignQueueService, EmailCampaignProcessor],
  exports: [EmailCampaignService, EmailCampaignQueueService],
})
export class EmailCampaignModule {}
