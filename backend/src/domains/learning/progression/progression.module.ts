import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgressionController } from '@/domains/learning/progression/progression.controller';
import { ProgressionService } from '@/domains/learning/progression/progression.service';
import { TrackingModule } from '@/shared/modules/tracking.module';
import { Cours, CoursSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { Challenge, ChallengeSchema } from '@/infrastructure/database/schemas/learning/challenge.schema';
import { Session, SessionSchema } from '@/infrastructure/database/schemas/commerce/session.schema';
import { Event, EventSchema } from '@/infrastructure/database/schemas/commerce/event.schema';
import { Product, ProductSchema } from '@/infrastructure/database/schemas/commerce/product.schema';
import { Post, PostSchema } from '@/infrastructure/database/schemas/content/post.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';

@Module({
  imports: [
    TrackingModule,
    MongooseModule.forFeature([
      { name: 'Cours', schema: CoursSchema },
      { name: 'Challenge', schema: ChallengeSchema },
      { name: 'Session', schema: SessionSchema },
      { name: 'Event', schema: EventSchema },
      { name: 'Product', schema: ProductSchema },
      { name: Post.name, schema: PostSchema },
      { name: Community.name, schema: CommunitySchema },
    ]),
  ],
  controllers: [ProgressionController],
  providers: [ProgressionService],
  exports: [ProgressionService],
})
export class ProgressionModule {}

