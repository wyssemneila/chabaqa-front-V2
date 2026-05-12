import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentManagementController } from '@/domains/admin/content-management/content-management.controller';
import { ContentManagementService } from '@/domains/admin/content-management/content-management.service';
import { Cours, CoursSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { Challenge, ChallengeSchema } from '@/infrastructure/database/schemas/learning/challenge.schema';
import { ChallengeSubmission, ChallengeSubmissionSchema } from '@/infrastructure/database/schemas/learning/challenge-submission.schema';
import { Event, EventSchema } from '@/infrastructure/database/schemas/commerce/event.schema';
import { Post, PostSchema } from '@/infrastructure/database/schemas/content/post.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { CourseEnrollment, CourseEnrollmentSchema } from '@/infrastructure/database/schemas/learning/course.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cours.name, schema: CoursSchema },
      { name: Challenge.name, schema: ChallengeSchema },
      { name: ChallengeSubmission.name, schema: ChallengeSubmissionSchema },
      { name: Event.name, schema: EventSchema },
      { name: Post.name, schema: PostSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: User.name, schema: UserSchema },
      { name: CourseEnrollment.name, schema: CourseEnrollmentSchema },
    ]),
  ],
  controllers: [ContentManagementController],
  providers: [ContentManagementService],
  exports: [ContentManagementService],
})
export class ContentManagementModule {}
