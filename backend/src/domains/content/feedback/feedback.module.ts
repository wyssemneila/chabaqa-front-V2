
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackController } from '@/domains/content/feedback/feedback.controller';
import { FeedbackService } from '@/domains/content/feedback/feedback.service';
import { Feedback, FeedbackSchema } from '@/infrastructure/database/schemas/content/feedback.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { CoursSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { Challenge, ChallengeSchema } from '@/infrastructure/database/schemas/learning/challenge.schema';
import { Event, EventSchema } from '@/infrastructure/database/schemas/commerce/event.schema';
import { Product, ProductSchema } from '@/infrastructure/database/schemas/commerce/product.schema';
import { Session, SessionSchema } from '@/infrastructure/database/schemas/commerce/session.schema';
import { AuthModule } from '@/domains/auth/auth.module';
import { CacheModule } from '@/shared/modules/cache.module';
import { CacheInvalidationService } from '@/shared/services/cache-invalidation.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Feedback.name, schema: FeedbackSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: 'Cours', schema: CoursSchema },
      { name: Challenge.name, schema: ChallengeSchema },
      { name: Event.name, schema: EventSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    AuthModule,
    CacheModule,
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService, CacheInvalidationService],
})
export class FeedbackModule {}
