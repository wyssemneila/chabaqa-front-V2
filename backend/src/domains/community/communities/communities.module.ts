import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunitiesController } from '@/domains/community/communities/communities.controller';
import { CommunitiesService } from '@/domains/community/communities/communities.service';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { Post, PostSchema } from '@/infrastructure/database/schemas/content/post.schema';
import { CommunityPageContentModule } from '@/domains/community/page-content/community-page-content.module';
import { UploadModule } from '@/domains/shared/upload/upload.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Community.name, schema: CommunitySchema },
      { name: User.name, schema: UserSchema },
      { name: Post.name, schema: PostSchema },
    ]),
    CommunityPageContentModule,
    UploadModule,
  ],
  controllers: [CommunitiesController],
  providers: [CommunitiesService],
  exports: [CommunitiesService],
})
export class CommunitiesModule { }
