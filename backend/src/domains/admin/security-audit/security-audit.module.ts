import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SecurityAuditController } from '@/domains/admin/security-audit/security-audit.controller';
import { SecurityAuditService } from '@/domains/admin/security-audit/security-audit.service';

// Import schemas
import { AuditLog, AuditLogSchema } from '@/domains/admin/schemas/audit-log.schema';
import { AdminUser, AdminUserSchema } from '@/domains/admin/schemas/admin-user.schema';
import { SecurityAlert, SecurityAlertSchema } from '@/domains/admin/schemas/security-alert.schema';

/**
 * Security audit module for security monitoring and audit trail management
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: SecurityAlert.name, schema: SecurityAlertSchema },
    ]),
  ],
  controllers: [SecurityAuditController],
  providers: [
    SecurityAuditService,
    // Note: SecurityMonitoringService, AdminNotificationService, AuditLogService, and EmailService
    // are provided by the parent AdminModule and AdminCommonModule
  ],
  exports: [
    SecurityAuditService,
  ],
})
export class SecurityAuditModule {}
