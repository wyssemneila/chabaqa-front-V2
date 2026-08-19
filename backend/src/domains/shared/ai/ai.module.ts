import { Module, forwardRef } from '@nestjs/common';
import { AiService } from '@/domains/shared/ai/ai.service';
import { AiController } from '@/domains/shared/ai/ai.controller';
import { AiTutorService } from './ai-tutor.service';
import { AiTutorContextService } from './ai-tutor-context.service';
import { AiTutorAnalyticsService } from './ai-tutor-analytics.service';
import { EmbeddingService } from './embeddings/embedding.service';
import { SemanticRetrievalService } from './embeddings/semantic-retrieval.service';
import { TranscriptionService } from './transcription/transcription.service';
import { ConfigModule } from '@nestjs/config';
import { CoursModule } from '@/domains/learning/course/cours.module';
import { ChapterAccessModule } from '@/shared/modules/chapter-access.module';
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
  AiKnowledgeDocument,
  AiKnowledgeDocumentSchema,
} from '@/infrastructure/database/schemas/ai/ai-knowledge-document.schema';
import {
  LearnerProfile,
  LearnerProfileSchema,
} from '@/infrastructure/database/schemas/ai/learner-profile.schema';
import { LearnerProfileService } from '@/domains/shared/ai/learner/learner-profile.service';
import { Subscription, SubscriptionSchema } from '@/infrastructure/database/schemas/commerce/subscription.schema';
import { Plan, PlanSchema } from '@/infrastructure/database/schemas/commerce/plan.schema';
import { CreatorUsageCounter, CreatorUsageCounterSchema } from '@/infrastructure/database/schemas/commerce/creator-usage-counter.schema';
import { CreatorWritingController } from './creator-writing/creator-writing.controller';
import { CreatorWritingService } from './creator-writing/creator-writing.service';
import { PolicyModule } from '@/shared/modules/policy.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => CoursModule),
    ChapterAccessModule,
    PolicyModule,
    MongooseModule.forFeature([
      { name: AiChapterConversation.name, schema: AiChapterConversationSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: Cours.name, schema: CoursSchema },
      { name: AiKnowledgeDocument.name, schema: AiKnowledgeDocumentSchema },
      { name: LearnerProfile.name, schema: LearnerProfileSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Plan.name, schema: PlanSchema },
      { name: CreatorUsageCounter.name, schema: CreatorUsageCounterSchema },
    ]),
  ],
  controllers: [
    AiController,
    CreatorWritingController,
  ],
  providers: [
    AiService,
    AiTutorService,
    AiTutorContextService,
    AiTutorAnalyticsService,
    EmbeddingService,
    SemanticRetrievalService,
    TranscriptionService,
    LearnerProfileService,
    CreatorWritingService,
  ],
  exports: [
    AiTutorService,
    AiTutorAnalyticsService,
    EmbeddingService,
    SemanticRetrievalService,
    TranscriptionService,
    LearnerProfileService,
    CreatorWritingService,
  ],
})
export class AiModule {}
