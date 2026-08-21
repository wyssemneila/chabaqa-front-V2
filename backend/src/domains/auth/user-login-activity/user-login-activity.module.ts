import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserLoginActivity, UserLoginActivitySchema } from '@/infrastructure/database/schemas/auth/user-login-activity.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { UserLoginActivityService } from '@/domains/auth/user-login-activity/user-login-activity.service';

/**
 * Module for managing user login activity tracking
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserLoginActivity.name, schema: UserLoginActivitySchema },
      { name: User.name, schema: UserSchema },
      { name: Community.name, schema: CommunitySchema },
    ]),
  ],
  providers: [UserLoginActivityService],
  exports: [UserLoginActivityService],
})
export class UserLoginActivityModule {}
