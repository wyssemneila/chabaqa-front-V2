import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsDaily, AnalyticsDailySchema } from '@/infrastructure/database/schemas/analytics/analytics-daily.schema';
import { AnalyticsRetention, AnalyticsRetentionSchema } from '@/infrastructure/database/schemas/analytics/analytics-retention.schema';
import { AnalyticsWeeklyReport, AnalyticsWeeklyReportSchema } from '@/infrastructure/database/schemas/analytics/analytics-weekly-report.schema';
import { AnalyticsService } from '@/domains/analytics/analytics.service';
import { AnalyticsController } from '@/domains/analytics/analytics.controller';
import { SubscriptionModule } from '@/domains/commerce/subscription/subscription.module';
import { PolicyModule } from '@/shared/modules/policy.module';
import { CoursSchema, CourseEnrollmentSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { Subscription, SubscriptionSchema } from '@/infrastructure/database/schemas/commerce/subscription.schema';
import { AnalyticsScheduler } from '@/domains/analytics/analytics.scheduler';
import { CreatorInsightsService } from '@/domains/analytics/creator-insights.service';

@Global()
@Module({
  imports: [
    SubscriptionModule,
    PolicyModule,
    MongooseModule.forFeature([
      { name: AnalyticsDaily.name, schema: AnalyticsDailySchema },
      { name: 'Cours', schema: CoursSchema },
      { name: 'CourseEnrollment', schema: CourseEnrollmentSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: AnalyticsRetention.name, schema: AnalyticsRetentionSchema },
      { name: AnalyticsWeeklyReport.name, schema: AnalyticsWeeklyReportSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsScheduler, CreatorInsightsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule { }


