import { Module } from '@nestjs/common';
import { AiService } from '@/domains/shared/ai/ai.service';
import { AiController } from '@/domains/shared/ai/ai.controller';
import { AiSettingsController } from './ai-settings.controller';
import { AiSettingsService } from './ai-settings.service';
import { AiUsageService } from './ai-usage.service';
import { AiTutorService } from './ai-tutor.service';
import { AiTutorContextService } from './ai-tutor-context.service';
import { AiTutorAnalyticsService } from './ai-tutor-analytics.service';
import { AiCreateService } from './ai-create.service';
import { AiAgentController } from './agents/ai-agent.controller';
import { AiAgentService } from './agents/ai-agent.service';
import { AiAgentChatService } from './agents/ai-agent-chat.service';
import { AiKnowledgeIndexerService } from './agents/ai-knowledge-indexer.service';
import { AiCofounderController } from './cofounder/ai-cofounder.controller';
import { AiCofounderService } from './cofounder/ai-cofounder.service';
import { AiLaunchPlanService } from './cofounder/ai-launch-plan.service';
import { AiPublishService } from './ai-publish.service';
import { ConfigModule } from '@nestjs/config';
import { CoursModule } from '@/domains/learning/course/cours.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AiChapterConversation,
  AiChapterConversationSchema,
} from '@/infrastructure/database/schemas/learning/ai-chapter-conversation.schema';
import {
  Community,
  CommunitySchema,
} from '@/infrastructure/database/schemas/community/community.schema';
import {
  Cours,
  CoursSchema,
} from '@/infrastructure/database/schemas/learning/course.schema';
import {
  AiAgent,
  AiAgentSchema,
} from '@/infrastructure/database/schemas/ai/ai-agent.schema';
import {
  AiKnowledgeDocument,
  AiKnowledgeDocumentSchema,
} from '@/infrastructure/database/schemas/ai/ai-knowledge-document.schema';
import {
  AiConversation,
  AiConversationSchema,
} from '@/infrastructure/database/schemas/ai/ai-conversation.schema';
import {
  AiLaunchPlan,
  AiLaunchPlanSchema,
} from '@/infrastructure/database/schemas/ai/ai-launch-plan.schema';
import {
  AiActionLog,
  AiActionLogSchema,
} from '@/infrastructure/database/schemas/ai/ai-action-log.schema';

@Module({
  imports: [
    ConfigModule,
    CoursModule,
    MongooseModule.forFeature([
      { name: AiChapterConversation.name, schema: AiChapterConversationSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: Cours.name, schema: CoursSchema },
      { name: AiAgent.name, schema: AiAgentSchema },
      { name: AiKnowledgeDocument.name, schema: AiKnowledgeDocumentSchema },
      { name: AiConversation.name, schema: AiConversationSchema },
      { name: AiLaunchPlan.name, schema: AiLaunchPlanSchema },
      { name: AiActionLog.name, schema: AiActionLogSchema },
    ]),
  ],
  controllers: [
    AiController,
    AiSettingsController,
    AiAgentController,
    AiCofounderController,
  ],
  providers: [
    AiService,
    AiTutorService,
    AiTutorContextService,
    AiTutorAnalyticsService,
    AiCreateService,
    AiSettingsService,
    AiUsageService,
    AiAgentService,
    AiAgentChatService,
    AiKnowledgeIndexerService,
    AiCofounderService,
    AiLaunchPlanService,
    AiPublishService,
  ],
  exports: [
    AiTutorService,
    AiTutorAnalyticsService,
    AiCreateService,
    AiUsageService,
    AiAgentChatService,
  ],
})
export class AiModule {}
