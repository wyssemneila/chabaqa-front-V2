import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PolicyService } from '@/shared/services/policy.service';
import { Subscription, SubscriptionSchema } from '@/infrastructure/database/schemas/commerce/subscription.schema';
import { Plan, PlanSchema } from '@/infrastructure/database/schemas/commerce/plan.schema';
import { Entitlement, EntitlementSchema } from '@/infrastructure/database/schemas/commerce/entitlement.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { Cours, CoursSchema, CourseEnrollment, CourseEnrollmentSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { Challenge, ChallengeSchema } from '@/infrastructure/database/schemas/learning/challenge.schema';
import { Resource, ResourceSchema } from '@/infrastructure/database/schemas/content/resource.schema';
import { ContentAccessService } from '@/shared/services/content-access.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
       { name: Plan.name, schema: PlanSchema },
       { name: Entitlement.name, schema: EntitlementSchema },
       { name: Community.name, schema: CommunitySchema },
       { name: Cours.name, schema: CoursSchema },
       { name: CourseEnrollment.name, schema: CourseEnrollmentSchema },
       { name: Challenge.name, schema: ChallengeSchema },
       { name: Resource.name, schema: ResourceSchema },
    ]),
  ],
   providers: [PolicyService, ContentAccessService],
   exports: [PolicyService, ContentAccessService],
})
export class PolicyModule {}


