import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunityManagementController } from '@/domains/admin/community-management/community-management.controller';
import { CommunityManagementService } from '@/domains/admin/community-management/community-management.service';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { Post, PostSchema } from '@/infrastructure/database/schemas/content/post.schema';
import { Cours, CoursSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { Event, EventSchema } from '@/infrastructure/database/schemas/commerce/event.schema';
import { Product, ProductSchema } from '@/infrastructure/database/schemas/commerce/product.schema';
import { AuditLogService } from '@/domains/admin/common/services/audit-log.service';
import { AuditLog, AuditLogSchema } from '@/domains/admin/schemas/audit-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Community.name, schema: CommunitySchema },
      { name: User.name, schema: UserSchema },
      { name: Post.name, schema: PostSchema },
      { name: Cours.name, schema: CoursSchema },
      { name: Event.name, schema: EventSchema },
      { name: Product.name, schema: ProductSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [CommunityManagementController],
  providers: [
    CommunityManagementService,
    AuditLogService,
  ],
  exports: [CommunityManagementService],
})
export class CommunityManagementModule {}