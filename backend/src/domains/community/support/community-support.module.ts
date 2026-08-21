import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunitySupportController } from '@/domains/community/support/community-support.controller';
import { CommunitySupportService } from '@/domains/community/support/community-support.service';
import {
  Conversation,
  ConversationSchema,
} from '@/infrastructure/database/schemas/communication/conversation.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Community.name, schema: CommunitySchema },
    ]),
  ],
  controllers: [CommunitySupportController],
  providers: [CommunitySupportService],
  exports: [CommunitySupportService],
})
export class CommunitySupportModule {}
