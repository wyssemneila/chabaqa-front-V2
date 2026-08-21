import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Achievement, AchievementSchema } from '@/infrastructure/database/schemas/shared/achievement.schema';
import { UserAchievement, UserAchievementSchema } from '@/infrastructure/database/schemas/shared/user-achievement.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { Post, PostSchema } from '@/infrastructure/database/schemas/content/post.schema';
import { UserLoginActivity, UserLoginActivitySchema } from '@/infrastructure/database/schemas/auth/user-login-activity.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { AchievementService } from '@/domains/shared/achievement/achievement.service';
import { AchievementController } from '@/domains/shared/achievement/achievement.controller';
import { ProgressionModule } from '@/domains/learning/progression/progression.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Achievement.name, schema: AchievementSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: Post.name, schema: PostSchema },
      { name: UserLoginActivity.name, schema: UserLoginActivitySchema },
      { name: User.name, schema: UserSchema },
    ]),
    ProgressionModule,
  ],
  controllers: [AchievementController],
  providers: [AchievementService],
  exports: [AchievementService],
})
export class AchievementModule {}