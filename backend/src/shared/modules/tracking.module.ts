import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentTrackingService } from '@/shared/services/content-tracking.service';
import { 
  ContentProgress, 
  ContentProgressSchema, 
  TrackingAction, 
  TrackingActionSchema 
} from '@/infrastructure/database/schemas/learning/content-tracking.schema';
import { Cours, CoursSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { Challenge, ChallengeSchema } from '@/infrastructure/database/schemas/learning/challenge.schema';
import { Session, SessionSchema } from '@/infrastructure/database/schemas/commerce/session.schema';
import { Event, EventSchema } from '@/infrastructure/database/schemas/commerce/event.schema';
import { Product, ProductSchema } from '@/infrastructure/database/schemas/commerce/product.schema';
import { Post, PostSchema } from '@/infrastructure/database/schemas/content/post.schema';
import { Ga4Module } from '@/domains/analytics/ga4/ga4.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ContentProgress', schema: ContentProgressSchema },
      { name: 'TrackingAction', schema: TrackingActionSchema },
      { name: Cours.name, schema: CoursSchema },
      { name: Challenge.name, schema: ChallengeSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Event.name, schema: EventSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Post.name, schema: PostSchema },
    ]),
    Ga4Module
  ],
  providers: [ContentTrackingService],
  exports: [ContentTrackingService, MongooseModule]
})
export class TrackingModule {}
