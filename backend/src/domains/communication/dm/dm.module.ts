import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';
import { DmService } from '@/domains/communication/dm/dm.service';
import { DmController } from '@/domains/communication/dm/dm.controller';
import { DmGateway } from '@/domains/communication/dm/dm.gateway';
import { Conversation, ConversationSchema } from '@/infrastructure/database/schemas/communication/conversation.schema';
import { Message, MessageSchema } from '@/infrastructure/database/schemas/communication/message.schema';
import { AuthModule } from '@/domains/auth/auth.module';
import { UploadModule } from '@/domains/shared/upload/upload.module';
import { PolicyModule } from '@/shared/modules/policy.module';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { Admin, AdminSchema } from '@/infrastructure/database/schemas/auth/admin.schema';
import { Session, SessionSchema } from '@/infrastructure/database/schemas/commerce/session.schema';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60, limit: 60 }]),
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    AuthModule,
    UploadModule,
    PolicyModule,
  ],
  controllers: [DmController],
  providers: [DmService, DmGateway],
  exports: [DmService, DmGateway],
})
export class DmModule {}


