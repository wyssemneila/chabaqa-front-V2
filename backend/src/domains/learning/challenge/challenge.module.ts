import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChallengeController } from '@/domains/learning/challenge/challenge.controller';
import { ChallengeService } from '@/domains/learning/challenge/challenge.service';
import { Challenge, ChallengeSchema } from '@/infrastructure/database/schemas/learning/challenge.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { AuthModule } from '@/domains/auth/auth.module';
import { TrackingModule } from '@/shared/modules/tracking.module';
import { FeeModule } from '@/shared/modules/fee.module';
import { OrderSchema } from '@/infrastructure/database/schemas/commerce/order.schema';
import { PolicyModule } from '@/shared/modules/policy.module';
import { UploadModule } from '@/domains/shared/upload/upload.module';
import { ContentProgressSchema } from '@/infrastructure/database/schemas/learning/content-tracking.schema';
import { ChallengeSubmission, ChallengeSubmissionSchema } from '@/infrastructure/database/schemas/learning/challenge-submission.schema';
import { AnalyticsDaily, AnalyticsDailySchema } from '@/infrastructure/database/schemas/analytics/analytics-daily.schema';
import { Ga4Module } from '@/domains/analytics/ga4/ga4.module';
import { CacheModule } from '@/infrastructure/cache/cache.module';
import { AiModule } from '@/domains/shared/ai/ai.module';
import { ChallengeAiCoachService } from '@/domains/learning/challenge/challenge-ai-coach.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Challenge.name, schema: ChallengeSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: User.name, schema: UserSchema },
      { name: 'Order', schema: OrderSchema },
      { name: 'ContentProgress', schema: ContentProgressSchema },
      { name: ChallengeSubmission.name, schema: ChallengeSubmissionSchema },
      { name: AnalyticsDaily.name, schema: AnalyticsDailySchema },
    ]),
    AuthModule,
    TrackingModule,
    FeeModule,
    PolicyModule,
    UploadModule,
    Ga4Module,
    CacheModule,
    AiModule,
  ],
  controllers: [ChallengeController],
  providers: [ChallengeService, ChallengeAiCoachService],
  exports: [ChallengeService],
})
export class ChallengeModule { }
