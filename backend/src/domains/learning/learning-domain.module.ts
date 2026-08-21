import { Module } from '@nestjs/common';
import { CoursDomainModule } from '@/domains/learning/course/cours-domain.module';
import { CourseEnrollmentModule } from '@/domains/learning/course-enrollment/course-enrollment.module';
import { AchievementModule } from '@/domains/shared/achievement/achievement.module';
import { ProgressionModule } from '@/domains/learning/progression/progression.module';
import { TrackingModule } from '@/shared/modules/tracking.module';

@Module({
  imports: [CoursDomainModule, CourseEnrollmentModule, AchievementModule, ProgressionModule, TrackingModule],
  exports: [CoursDomainModule, CourseEnrollmentModule, AchievementModule, ProgressionModule, TrackingModule],
})
export class LearningDomainModule {}
