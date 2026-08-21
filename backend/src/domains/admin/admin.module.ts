import { Module, NestModule, MiddlewareConsumer, Global, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminController } from '@/domains/admin/admin.controller';
import { AdminService } from '@/domains/admin/admin.service';
import { AdminNotificationsService } from '@/domains/admin/admin-notifications.service';

// Import existing schemas
import { Admin, AdminSchema } from '@/infrastructure/database/schemas/auth/admin.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { VerificationCode, VerificationCodeSchema } from '@/infrastructure/database/schemas/auth/verification-code.schema';
import { RevokedToken, RevokedTokenSchema } from '@/infrastructure/database/schemas/auth/revoked-token.schema';

// Import schemas for AnalyticsService
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { Order, OrderSchema } from '@/infrastructure/database/schemas/commerce/order.schema';
import { Subscription, SubscriptionSchema } from '@/infrastructure/database/schemas/commerce/subscription.schema';
import { Cours, CoursSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { Conversation, ConversationSchema } from '@/infrastructure/database/schemas/communication/conversation.schema';

// Import new admin-specific schemas
import { AdminUser, AdminUserSchema } from '@/domains/admin/schemas/admin-user.schema';
import { AuditLog, AuditLogSchema } from '@/domains/admin/schemas/audit-log.schema';
import { SecurityAlert, SecurityAlertSchema } from '@/domains/admin/schemas/security-alert.schema';
import { ContentModerationQueue, ContentModerationQueueSchema } from '@/domains/admin/schemas/content-moderation-queue.schema';

// Import common services
import { TokenBlacklistService } from '@/shared/services/token-blacklist.service';
import { EmailService } from '@/shared/services/email.service';

// Import required modules for integration (these are now global)
import { AuthModule } from '@/domains/auth/auth.module';
import { UploadModule } from '@/domains/shared/upload/upload.module';
import { DmModule } from '@/domains/communication/dm/dm.module';
import { EmailModule } from '@/domains/communication/email/email.module';
import { PaymentModule } from '@/shared/modules/payment.module';

// Import admin common module
import { AdminCommonModule } from '@/domains/admin/common/admin-common.module';

// Import admin services that need external dependencies
import { AdminNotificationService } from '@/domains/admin/common/services/admin-notification.service';
import { AdminIntegrationService } from '@/domains/admin/common/services/admin-integration.service';
import { AdminWebSocketService } from '@/domains/admin/common/services/admin-websocket.service';

// Import admin middleware
import { AuditLogMiddleware } from '@/domains/admin/common/middleware/audit-log.middleware';

// Import admin interceptors and filters
import { AdminResponseInterceptor } from '@/domains/admin/common/interceptors/admin-response.interceptor';
import { AdminExceptionFilter } from '@/domains/admin/common/filters/admin-exception.filter';
import { AdminRateLimitGuard } from '@/domains/admin/common/guards/admin-rate-limit.guard';

// Import admin modules
import { SecurityAuditModule } from '@/domains/admin/security-audit/security-audit.module';
import { UserManagementModule } from '@/domains/admin/user-management/user-management.module';
import { CommunityManagementModule } from '@/domains/admin/community-management/community-management.module';
import { ContentManagementModule } from '@/domains/admin/content-management/content-management.module';
import { ContentModerationModule } from '@/domains/admin/content-moderation/content-moderation.module';
import { FinancialManagementModule } from '@/domains/admin/financial-management/financial-management.module';
import { AnalyticsDashboardModule } from '@/domains/admin/analytics-dashboard/analytics-dashboard.module';
import { DataManagementModule } from '@/domains/admin/common/data-management.module';
import { CommunicationManagementModule } from '@/domains/admin/communication-management/communication-management.module';
import { AdminAlertConfig, AdminAlertConfigSchema } from '@/domains/admin/analytics-dashboard/schemas/admin-alert-config.schema';

// Import admin controllers
import { ExportController } from '@/domains/admin/common/controllers/export.controller';
import { AnalyticsController } from '@/domains/admin/common/controllers/analytics.controller';

/**
 * Enhanced Admin Module for comprehensive platform administration
 * Provides role-based access control, audit logging, and administrative functionality
 */
@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      // Existing admin schemas
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
      { name: VerificationCode.name, schema: VerificationCodeSchema },
      { name: RevokedToken.name, schema: RevokedTokenSchema },
      
      // Additional schemas for AnalyticsService
      { name: Community.name, schema: CommunitySchema },
      { name: Order.name, schema: OrderSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Cours.name, schema: CoursSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: AdminAlertConfig.name, schema: AdminAlertConfigSchema },

      // New admin-specific schemas
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: SecurityAlert.name, schema: SecurityAlertSchema },
      { name: ContentModerationQueue.name, schema: ContentModerationQueueSchema },
    ]),
    ConfigModule,
    
    // Import required modules for integration (these are now global)
    AuthModule,
    UploadModule,
    DmModule,
    EmailModule,
    PaymentModule,
    
    // Import admin common module (provides shared services)
    AdminCommonModule,
    
    // Configure rate limiting for admin module
    ThrottlerModule.forRoot([
      {
        name: 'admin-default',
        ttl: 60000, // 60 seconds
        limit: 1000, // 1000 requests per minute
      },
      {
        name: 'admin-strict',
        ttl: 60000, // 60 seconds
        limit: 200, // 200 requests per minute for sensitive operations
      },
      {
        name: 'admin-bulk',
        ttl: 60000, // 60 seconds
        limit: 200, // 200 requests per minute for bulk operations
      },
    ]),
    
    // Import admin sub-modules
    SecurityAuditModule,
    UserManagementModule,
    CommunityManagementModule,
    ContentManagementModule,
    ContentModerationModule,
    FinancialManagementModule,
    AnalyticsDashboardModule,
    DataManagementModule,
    CommunicationManagementModule,
  ],
  controllers: [AdminController, ExportController, AnalyticsController],
  providers: [
    // Core admin services
    AdminService,
    AdminNotificationsService,
    TokenBlacklistService,
    EmailService, // Provide EmailService from common/services for AdminService
    
    // Services with external dependencies (provided here where deps are available)
    AdminNotificationService,
    AdminWebSocketService,
    AdminIntegrationService,
    
    // Admin middleware
    AuditLogMiddleware,
    
    // Global admin interceptor for consistent responses
    {
      provide: APP_INTERCEPTOR,
      useClass: AdminResponseInterceptor,
    },
    
    // Global admin exception filter for consistent error handling
    {
      provide: APP_FILTER,
      useClass: AdminExceptionFilter,
    },
    
    // Global rate limiting guard for admin endpoints
    {
      provide: APP_GUARD,
      useClass: AdminRateLimitGuard,
    },
  ],
  exports: [
    AdminService,
    AdminNotificationsService,
    AdminCommonModule,
    // Export services that other modules might need
    AdminNotificationService,
    AdminWebSocketService,
    AdminIntegrationService,
  ]
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuditLogMiddleware)
      .forRoutes({ path: 'admin/*path', method: RequestMethod.ALL });
  }
}
