import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '@/domains/auth/auth.module';
import { Conversation, ConversationSchema } from '@/infrastructure/database/schemas/communication/conversation.schema';
import { SupportMessage, SupportMessageSchema } from '@/infrastructure/database/schemas/communication/support-message.schema';
import { Admin, AdminSchema } from '@/infrastructure/database/schemas/auth/admin.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { LiveSupportController } from '@/domains/communication/live-support/live-support.controller';
import { LiveSupportService } from '@/domains/communication/live-support/live-support.service';
import { LiveSupportGateway } from '@/domains/communication/live-support/live-support.gateway';
import { LiveSupportAiService } from '@/domains/communication/live-support/live-support-ai.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: SupportMessage.name, schema: SupportMessageSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [LiveSupportController],
  providers: [LiveSupportService, LiveSupportGateway, LiveSupportAiService],
  exports: [LiveSupportService, LiveSupportGateway],
})
export class LiveSupportModule {}
