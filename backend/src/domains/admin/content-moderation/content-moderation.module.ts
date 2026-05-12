import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentModerationController } from '@/domains/admin/content-moderation/content-moderation.controller';
import { ContentModerationService } from '@/domains/admin/content-moderation/content-moderation.service';
import { 
  ContentModerationQueue, 
  ContentModerationQueueSchema 
} from '@/domains/admin/schemas/content-moderation-queue.schema';
import { AuditLog, AuditLogSchema } from '@/domains/admin/schemas/audit-log.schema';

// Import content schemas for moderation integration
import { Post, PostSchema } from '@/infrastructure/database/schemas/content/post.schema';
import { Cours, CoursSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { Event, EventSchema } from '@/infrastructure/database/schemas/commerce/event.schema';
import { Product, ProductSchema } from '@/infrastructure/database/schemas/commerce/product.schema';

/**
 * Content Moderation Module
 * 
 * Provides comprehensive content moderation functionality including:
 * - Content moderation queue management
 * - Individual and bulk content moderation
 * - Content priority management
 * - Moderator assignment
 * - Moderation analytics and statistics
 * 
 * This module integrates with the audit logging system to track all
 * moderation actions and provides role-based access control for
 * content moderators and administrators.
 * 
 * Note: AuditLogService and AdminNotificationService are provided by
 * the parent AdminModule and AdminCommonModule.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContentModerationQueue.name, schema: ContentModerationQueueSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: Post.name, schema: PostSchema },
      { name: Cours.name, schema: CoursSchema },
      { name: Event.name, schema: EventSchema },
      { name: Product.name, schema: ProductSchema },
    ])
  ],
  controllers: [ContentModerationController],
  providers: [
    ContentModerationService,
    // Note: AuditLogService and AdminNotificationService are provided by parent modules
  ],
  exports: [ContentModerationService]
})
export class ContentModerationModule {}