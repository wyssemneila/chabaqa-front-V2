import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunityModerationController } from '@/domains/community/moderation/community-moderation.controller';
import { CommunityModerationService } from '@/domains/community/moderation/community-moderation.service';
import { Post, PostSchema } from '@/infrastructure/database/schemas/content/post.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CommunityModerationController],
  providers: [CommunityModerationService],
  exports: [CommunityModerationService],
})
export class CommunityModerationModule {}
