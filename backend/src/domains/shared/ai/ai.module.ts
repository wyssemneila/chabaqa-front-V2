import { Module } from '@nestjs/common';
import { AiService } from '@/domains/shared/ai/ai.service';
import { AiController } from '@/domains/shared/ai/ai.controller';
import { ConfigModule } from '@nestjs/config';
import { CoursModule } from '@/domains/learning/course/cours.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AiChapterConversation,
  AiChapterConversationSchema,
} from '@/infrastructure/database/schemas/learning/ai-chapter-conversation.schema';

@Module({
  imports: [
    ConfigModule,
    CoursModule,
    MongooseModule.forFeature([
      { name: AiChapterConversation.name, schema: AiChapterConversationSchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
