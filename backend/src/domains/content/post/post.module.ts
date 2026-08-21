import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostService } from '@/domains/content/post/post.service';
import { PostController } from '@/domains/content/post/post.controller';
import { Post, PostSchema } from '@/infrastructure/database/schemas/content/post.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { AuthModule } from '@/domains/auth/auth.module';
import { TrackingModule } from '@/shared/modules/tracking.module';
import { NotificationModule } from '@/domains/communication/notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: User.name, schema: UserSchema }
    ]),
    AuthModule,
    TrackingModule,
    NotificationModule,
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService]
})
export class PostModule {}
