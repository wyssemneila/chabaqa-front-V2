import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserManagementController } from '@/domains/admin/user-management/user-management.controller';
import { UserManagementService } from '@/domains/admin/user-management/user-management.service';

// Import schemas
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { AdminUser, AdminUserSchema } from '@/domains/admin/schemas/admin-user.schema';
import { AuditLog, AuditLogSchema } from '@/domains/admin/schemas/audit-log.schema';

// Import common services
import { AuditLogService } from '@/domains/admin/common/services/audit-log.service';
import { EmailService } from '@/shared/services/email.service';
import { AnalyticsService } from '@/domains/admin/common/services/analytics.service';

/**
 * User Management Module for Admin System
 * Provides comprehensive user administration capabilities
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [UserManagementController],
  providers: [
    UserManagementService,
    AuditLogService,
    EmailService,
    AnalyticsService,
  ],
  exports: [UserManagementService],
})
export class UserManagementModule {}