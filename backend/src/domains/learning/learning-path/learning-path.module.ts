import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { LearningPathController } from '@/domains/learning/learning-path/learning-path.controller';
import { LearningPathService } from '@/domains/learning/learning-path/learning-path.service';
import { LearningPathAiService } from '@/domains/learning/learning-path/learning-path-ai.service';
import { AiModule } from '@/domains/shared/ai/ai.module';
import {
  LearningPathRecommendation,
  LearningPathRecommendationSchema,
} from '@/infrastructure/database/schemas/learning/learning-path-recommendation.schema';
import { Cours, CoursSchema, CourseEnrollmentSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { Challenge, ChallengeSchema } from '@/infrastructure/database/schemas/learning/challenge.schema';
import { Resource, ResourceSchema } from '@/infrastructure/database/schemas/content/resource.schema';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => AiModule),
    MongooseModule.forFeature([
      { name: LearningPathRecommendation.name, schema: LearningPathRecommendationSchema },
      { name: 'CourseEnrollment', schema: CourseEnrollmentSchema },
      { name: Cours.name, schema: CoursSchema },
      { name: Challenge.name, schema: ChallengeSchema },
      { name: Resource.name, schema: ResourceSchema },
    ]),
  ],
  controllers: [LearningPathController],
  providers: [LearningPathService, LearningPathAiService],
})
export class LearningPathModule {}
