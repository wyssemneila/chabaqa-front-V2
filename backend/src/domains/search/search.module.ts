import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchController } from '@/domains/search/search.controller';
import { SearchService } from '@/domains/search/search.service';
import { AiModule } from '@/domains/shared/ai/ai.module';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { Cours, CoursSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { Event, EventSchema } from '@/infrastructure/database/schemas/commerce/event.schema';
import { Product, ProductSchema } from '@/infrastructure/database/schemas/commerce/product.schema';
import { Post, PostSchema } from '@/infrastructure/database/schemas/content/post.schema';

@Module({
  imports: [
    forwardRef(() => AiModule),
    MongooseModule.forFeature([
      { name: Community.name, schema: CommunitySchema },
      { name: Cours.name, schema: CoursSchema },
      { name: Event.name, schema: EventSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Post.name, schema: PostSchema },
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
