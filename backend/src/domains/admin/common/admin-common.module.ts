import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Import schemas
import { AuditLog, AuditLogSchema } from '@/domains/admin/schemas/audit-log.schema';
import { AdminUser, AdminUserSchema } from '@/domains/admin/schemas/admin-user.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { Admin, AdminSchema } from '@/infrastructure/database/schemas/auth/admin.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { Order, OrderSchema } from '@/infrastructure/database/schemas/commerce/order.schema';
import { Subscription, SubscriptionSchema } from '@/infrastructure/database/schemas/commerce/subscription.schema';
import { Cours, CoursSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { Post, PostSchema } from '@/infrastructure/database/schemas/content/post.schema';
import { Event, EventSchema } from '@/infrastructure/database/schemas/commerce/event.schema';
import { Product, ProductSchema } from '@/infrastructure/database/schemas/commerce/product.schema';
import {
  UserLoginActivity,
  UserLoginActivitySchema,
} from '@/infrastructure/database/schemas/auth/user-login-activity.schema';

// Import common services (only those without external dependencies)
import { AuditLogService } from '@/domains/admin/common/services/audit-log.service';
import { ExportService } from '@/domains/admin/common/services/export.service';
import { AnalyticsService } from '@/domains/admin/common/services/analytics.service';
import { SecurityMonitoringService } from '@/domains/admin/common/services/security-monitoring.service';

// Import guards
import { AdminAuthGuard } from '@/domains/admin/common/guards/admin-auth.guard';
import { AdminRolesGuard } from '@/domains/admin/common/guards/admin-roles.guard';

/**
 * AdminCommonModule provides shared admin-specific services and guards
 * for all admin sub-modules. This is a global module to avoid circular dependencies.
 * 
 * Services with external dependencies (AdminNotificationService, AdminWebSocketService, 
 * AdminIntegrationService) are provided in the main AdminModule.
 */
@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: Order.name, schema: OrderSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Cours.name, schema: CoursSchema },
      { name: Post.name, schema: PostSchema },
      { name: Event.name, schema: EventSchema },
      { name: Product.name, schema: ProductSchema },
      { name: UserLoginActivity.name, schema: UserLoginActivitySchema },
    ]),
  ],
  providers: [
    // Admin-specific services (no external dependencies)
    AuditLogService,
    ExportService,
    AnalyticsService,
    SecurityMonitoringService,
    
    // Guards
    AdminAuthGuard,
    AdminRolesGuard,
  ],
  exports: [
    // Export admin services
    AuditLogService,
    ExportService,
    AnalyticsService,
    SecurityMonitoringService,
    AdminAuthGuard,
    AdminRolesGuard,
    
    // Export MongooseModule for schemas
    MongooseModule,
  ],
})
export class AdminCommonModule {}
