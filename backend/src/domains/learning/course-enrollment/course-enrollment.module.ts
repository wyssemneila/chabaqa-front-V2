import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourseEnrollmentController } from '@/domains/learning/course-enrollment/course-enrollment.controller';
import { CourseEnrollmentService } from '@/domains/learning/course-enrollment/course-enrollment.service';
import { CourseEnrollment, CourseEnrollmentSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { Cours, CoursSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { AchievementModule } from '@/domains/shared/achievement/achievement.module';
import { TrackingModule } from '@/shared/modules/tracking.module';
import { ChapterAccessModule } from '@/shared/modules/chapter-access.module';
import { AnalyticsDaily, AnalyticsDailySchema } from '@/infrastructure/database/schemas/analytics/analytics-daily.schema';
import { PolicyModule } from '@/shared/modules/policy.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CourseEnrollment.name, schema: CourseEnrollmentSchema },
      { name: Cours.name, schema: CoursSchema },
      { name: User.name, schema: UserSchema },
      { name: AnalyticsDaily.name, schema: AnalyticsDailySchema }
    ]),
    AchievementModule,
    TrackingModule,
    ChapterAccessModule,
    PolicyModule,
  ],
  controllers: [CourseEnrollmentController],
  providers: [CourseEnrollmentService],
  exports: [CourseEnrollmentService]
})
export class CourseEnrollmentModule {}
