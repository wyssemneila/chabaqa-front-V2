import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument, AdminAction } from '@/domains/admin/schemas/audit-log.schema';
import {
  AlertSeverity,
  SecurityAlert as SecurityAlertModel,
  SecurityAlertDocument,
  SecurityAlertType,
} from '@/domains/admin/schemas/security-alert.schema';
import { AdminNotificationService } from '@/domains/admin/common/services/admin-notification.service';

export { AlertSeverity, SecurityAlertType };

/**
 * Security alert interface
 */
export interface SecurityAlert {
  id?: string;
  type: SecurityAlertType;
  severity: AlertSeverity;
  adminUserId: Types.ObjectId;
  title: string;
  description: string;
  metadata: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  resolutionNotes?: string;
}

/**
 * Security monitoring configuration
 */
export interface SecurityMonitoringConfig {
  // Failed login attempts threshold
  maxFailedLogins: number;
  failedLoginTimeWindow: number; // minutes
  
  // Activity volume thresholds
  maxActionsPerHour: number;
  maxBulkOperationsPerDay: number;
  maxDataExportsPerDay: number;
  
  // Time-based monitoring
  businessHoursStart: number; // hour (0-23)
  businessHoursEnd: number; // hour (0-23)
  
  // Geographic monitoring
  enableGeographicMonitoring: boolean;
  allowedCountries: string[];
  
  // Sensitive actions monitoring
  sensitiveActions: AdminAction[];
  
  // Alert notification settings
  notifyOnCritical: boolean;
  notifyOnHigh: boolean;
  alertRecipients: string[];
}

/**
 * Default security monitoring configuration
 */
const DEFAULT_CONFIG: SecurityMonitoringConfig = {
  maxFailedLogins: 5,
  failedLoginTimeWindow: 15,
  maxActionsPerHour: 100,
  maxBulkOperationsPerDay: 10,
  maxDataExportsPerDay: 5,
  businessHoursStart: 8,
  businessHoursEnd: 18,
  enableGeographicMonitoring: false,
  allowedCountries: [],
  sensitiveActions: [
    AdminAction.USER_SUSPEND,
    AdminAction.USER_PASSWORD_RESET,
    AdminAction.ADMIN_USER_CREATE,
    AdminAction.ADMIN_USER_UPDATE,
    AdminAction.ADMIN_USER_DELETE,
    AdminAction.DATA_EXPORT,
    AdminAction.AUDIT_LOG_EXPORT,
    AdminAction.PAYOUT_PROCESS,
    AdminAction.EMAIL_CAMPAIGN_SEND,
    AdminAction.BULK_MESSAGE_SEND,
    AdminAction.CONTENT_DELETE,
    AdminAction.SYSTEM_CONFIGURATION,
  ],
  notifyOnCritical: true,
  notifyOnHigh: true,
  alertRecipients: [],
};

/**
 * Security monitoring and alerting service
 * Monitors admin activities for suspicious behavior and security threats
 */
@Injectable()
export class SecurityMonitoringService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(SecurityMonitoringService.name);
  private config: SecurityMonitoringConfig = DEFAULT_CONFIG;
  private alerts: Map<string, SecurityAlert> = new Map();
  private periodicSecurityChecksTimer?: NodeJS.Timeout;
  private alertCleanupTimer?: NodeJS.Timeout;

  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    @InjectModel(SecurityAlertModel.name) private securityAlertModel: Model<SecurityAlertDocument>,
    private adminNotificationService: AdminNotificationService,
  ) {
    // Only start monitoring processes in non-test environments
    if (process.env.NODE_ENV !== 'test') {
      this.startPeriodicMonitoring();
    }
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.hydrateOpenAlertsFromStore();
  }

  onModuleDestroy(): void {
    if (this.periodicSecurityChecksTimer) {
      clearInterval(this.periodicSecurityChecksTimer);
      this.periodicSecurityChecksTimer = undefined;
    }

    if (this.alertCleanupTimer) {
      clearInterval(this.alertCleanupTimer);
      this.alertCleanupTimer = undefined;
    }
  }

  /**
   * Update security monitoring configuration
   */
  updateConfiguration(config: Partial<SecurityMonitoringConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.log('Security monitoring configuration updated');
  }

  /**
   * Get current security monitoring configuration
   */
  getConfiguration(): SecurityMonitoringConfig {
    return { ...this.config };
  }

  /**
   * Monitor a specific admin action for security threats
   */
  async monitorAction(auditLog: AuditLog): Promise<void> {
    try {
      // Check for various security threats
      await Promise.all([
        this.checkFailedLoginAttempts(auditLog),
        this.checkUnusualActivityPattern(auditLog),
        this.checkBulkOperationAbuse(auditLog),
        this.checkDataExportAbuse(auditLog),
        this.checkAfterHoursAccess(auditLog),
        this.checkHighVolumeActions(auditLog),
        this.checkSensitiveDataAccess(auditLog),
      ]);
    } catch (error) {
      this.logger.error('Error monitoring admin action:', error);
    }
  }

  /**
   * Check for multiple failed login attempts
   */
  private async checkFailedLoginAttempts(auditLog: AuditLog): Promise<void> {
    if (auditLog.action !== AdminAction.LOGIN || auditLog.status === 'success') {
      return;
    }

    const timeWindow = new Date(Date.now() - this.config.failedLoginTimeWindow * 60 * 1000);
    
    const failedAttempts = await this.auditLogModel.countDocuments({
      adminUserId: auditLog.adminUserId,
      action: AdminAction.LOGIN,
      status: 'failed',
      timestamp: { $gte: timeWindow },
    });

    if (failedAttempts >= this.config.maxFailedLogins) {
      await this.createAlert({
        type: SecurityAlertType.MULTIPLE_FAILED_ATTEMPTS,
        severity: AlertSeverity.HIGH,
        adminUserId: auditLog.adminUserId,
        title: 'Multiple Failed Login Attempts',
        description: `Admin user has ${failedAttempts} failed login attempts in the last ${this.config.failedLoginTimeWindow} minutes`,
        metadata: {
          failedAttempts,
          timeWindow: this.config.failedLoginTimeWindow,
          ipAddress: auditLog.ipAddress,
          userAgent: auditLog.userAgent,
        },
        timestamp: new Date(),
        resolved: false,
      });
    }
  }

  /**
   * Check for unusual activity patterns
   */
  private async checkUnusualActivityPattern(auditLog: AuditLog): Promise<void> {
    try {
      // Check for rapid succession of different action types
      const recentActions = await this.auditLogModel
        .find({
          adminUserId: auditLog.adminUserId,
          timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
        })
        .sort({ timestamp: -1 })
        .limit(20);

      // Handle case where no recent actions are found
      if (!recentActions || recentActions.length === 0) {
        return;
      }

      const uniqueActions = new Set(recentActions.map(log => log.action));
      const uniqueEntityTypes = new Set(recentActions.map(log => log.entityType));

      // Alert if too many different actions or entity types in short time
      if (uniqueActions.size > 8 || uniqueEntityTypes.size > 5) {
        await this.createAlert({
          type: SecurityAlertType.UNUSUAL_ACTIVITY_PATTERN,
          severity: AlertSeverity.MEDIUM,
          adminUserId: auditLog.adminUserId,
          title: 'Unusual Activity Pattern Detected',
          description: `Admin user performed ${uniqueActions.size} different action types across ${uniqueEntityTypes.size} entity types in 5 minutes`,
          metadata: {
            uniqueActions: Array.from(uniqueActions),
            uniqueEntityTypes: Array.from(uniqueEntityTypes),
            totalActions: recentActions.length,
          },
          timestamp: new Date(),
          resolved: false,
        });
      }
    } catch (error) {
      this.logger.error('Error checking unusual activity pattern:', error);
    }
  }

  /**
   * Check for bulk operation abuse
   */
  private async checkBulkOperationAbuse(auditLog: AuditLog): Promise<void> {
    if (auditLog.action !== AdminAction.BULK_OPERATION) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bulkOperationsToday = await this.auditLogModel.countDocuments({
      adminUserId: auditLog.adminUserId,
      action: AdminAction.BULK_OPERATION,
      timestamp: { $gte: today },
    });

    if (bulkOperationsToday > this.config.maxBulkOperationsPerDay) {
      await this.createAlert({
        type: SecurityAlertType.BULK_OPERATION_ABUSE,
        severity: AlertSeverity.HIGH,
        adminUserId: auditLog.adminUserId,
        title: 'Excessive Bulk Operations',
        description: `Admin user performed ${bulkOperationsToday} bulk operations today, exceeding the limit of ${this.config.maxBulkOperationsPerDay}`,
        metadata: {
          bulkOperationsToday,
          limit: this.config.maxBulkOperationsPerDay,
          entityType: auditLog.entityType,
        },
        timestamp: new Date(),
        resolved: false,
      });
    }
  }

  /**
   * Check for data export abuse
   */
  private async checkDataExportAbuse(auditLog: AuditLog): Promise<void> {
    if (auditLog.action !== AdminAction.DATA_EXPORT && auditLog.action !== AdminAction.AUDIT_LOG_EXPORT) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exportsToday = await this.auditLogModel.countDocuments({
      adminUserId: auditLog.adminUserId,
      action: { $in: [AdminAction.DATA_EXPORT, AdminAction.AUDIT_LOG_EXPORT] },
      timestamp: { $gte: today },
    });

    if (exportsToday > this.config.maxDataExportsPerDay) {
      await this.createAlert({
        type: SecurityAlertType.DATA_EXPORT_ABUSE,
        severity: AlertSeverity.CRITICAL,
        adminUserId: auditLog.adminUserId,
        title: 'Excessive Data Exports',
        description: `Admin user performed ${exportsToday} data exports today, exceeding the limit of ${this.config.maxDataExportsPerDay}`,
        metadata: {
          exportsToday,
          limit: this.config.maxDataExportsPerDay,
          exportType: auditLog.action,
        },
        timestamp: new Date(),
        resolved: false,
      });
    }
  }

  /**
   * Check for after-hours access
   */
  private async checkAfterHoursAccess(auditLog: AuditLog): Promise<void> {
    const timestamp = auditLog.timestamp instanceof Date
      ? auditLog.timestamp
      : new Date((auditLog as any).timestamp || Date.now());
    const hour = timestamp.getHours();
    
    if (hour >= this.config.businessHoursStart && hour <= this.config.businessHoursEnd) {
      return; // Within business hours
    }

    // Check if this is a sensitive action
    if (this.config.sensitiveActions.includes(auditLog.action)) {
      await this.createAlert({
        type: SecurityAlertType.AFTER_HOURS_ACCESS,
        severity: AlertSeverity.MEDIUM,
        adminUserId: auditLog.adminUserId,
        title: 'After-Hours Sensitive Action',
        description: `Admin user performed sensitive action "${auditLog.action}" outside business hours`,
        metadata: {
          action: auditLog.action,
          hour,
          businessHours: `${this.config.businessHoursStart}-${this.config.businessHoursEnd}`,
          entityType: auditLog.entityType,
        },
        timestamp: new Date(),
        resolved: false,
      });
    }
  }

  /**
   * Check for high volume of actions
   */
  private async checkHighVolumeActions(auditLog: AuditLog): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const actionsLastHour = await this.auditLogModel.countDocuments({
      adminUserId: auditLog.adminUserId,
      timestamp: { $gte: oneHourAgo },
    });

    if (actionsLastHour > this.config.maxActionsPerHour) {
      await this.createAlert({
        type: SecurityAlertType.HIGH_VOLUME_ACTIONS,
        severity: AlertSeverity.MEDIUM,
        adminUserId: auditLog.adminUserId,
        title: 'High Volume of Actions',
        description: `Admin user performed ${actionsLastHour} actions in the last hour, exceeding the limit of ${this.config.maxActionsPerHour}`,
        metadata: {
          actionsLastHour,
          limit: this.config.maxActionsPerHour,
          currentAction: auditLog.action,
        },
        timestamp: new Date(),
        resolved: false,
      });
    }
  }

  /**
   * Check for sensitive data access
   */
  private async checkSensitiveDataAccess(auditLog: AuditLog): Promise<void> {
    if (!this.config.sensitiveActions.includes(auditLog.action)) {
      return;
    }

    // Log all sensitive actions for monitoring
    this.logger.warn(`Sensitive action performed: ${auditLog.action} by admin ${auditLog.adminUserId}`);

    // Check for multiple sensitive actions in short time
    const recentSensitiveActions = await this.auditLogModel.countDocuments({
      adminUserId: auditLog.adminUserId,
      action: { $in: this.config.sensitiveActions },
      timestamp: { $gte: new Date(Date.now() - 10 * 60 * 1000) }, // Last 10 minutes
    });

    if (recentSensitiveActions > 3) {
      await this.createAlert({
        type: SecurityAlertType.SENSITIVE_DATA_ACCESS,
        severity: AlertSeverity.HIGH,
        adminUserId: auditLog.adminUserId,
        title: 'Multiple Sensitive Actions',
        description: `Admin user performed ${recentSensitiveActions} sensitive actions in the last 10 minutes`,
        metadata: {
          sensitiveActionsCount: recentSensitiveActions,
          currentAction: auditLog.action,
          entityType: auditLog.entityType,
        },
        timestamp: new Date(),
        resolved: false,
      });
    }
  }

  /**
   * Create a security alert
   */
  private async createAlert(alert: SecurityAlert): Promise<void> {
    let storedAlert = alert;

    try {
      const createdAlert = await this.securityAlertModel.create({
        type: alert.type,
        severity: alert.severity,
        adminUserId: alert.adminUserId,
        title: alert.title,
        description: alert.description,
        metadata: alert.metadata || {},
        timestamp: alert.timestamp,
        resolved: alert.resolved,
      });
      storedAlert = this.mapStoredAlert(createdAlert);
    } catch (error) {
      const fallbackId = new Types.ObjectId().toString();
      storedAlert = { ...alert, id: fallbackId };
      this.logger.error('Failed to persist security alert; keeping in-memory alert for current process:', error);
    }

    this.alerts.set(storedAlert.id!, storedAlert);

    this.logger.warn(`Security alert created: ${storedAlert.type} - ${storedAlert.title}`);

    // Send notification if configured
    if (this.shouldNotifyForSeverity(storedAlert.severity)) {
      await this.adminNotificationService.sendSecurityAlert(storedAlert);
    }
  }

  /**
   * Get all security alerts
   */
  getAlerts(filters?: {
    severity?: AlertSeverity;
    type?: SecurityAlertType;
    resolved?: boolean;
    adminUserId?: string;
  }): SecurityAlert[] {
    let alerts = Array.from(this.alerts.values());

    if (filters) {
      if (filters.severity) {
        alerts = alerts.filter(alert => alert.severity === filters.severity);
      }
      if (filters.type) {
        alerts = alerts.filter(alert => alert.type === filters.type);
      }
      if (filters.resolved !== undefined) {
        alerts = alerts.filter(alert => alert.resolved === filters.resolved);
      }
      if (filters.adminUserId) {
        alerts = alerts.filter(alert => alert.adminUserId.toString() === filters.adminUserId);
      }
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get security alerts from the durable store.
   */
  async listAlerts(filters?: {
    severity?: AlertSeverity;
    type?: SecurityAlertType;
    resolved?: boolean;
    adminUserId?: string;
  }): Promise<SecurityAlert[]> {
    const query: Record<string, any> = {};

    if (filters?.severity) {
      query.severity = filters.severity;
    }
    if (filters?.type) {
      query.type = filters.type;
    }
    if (filters?.resolved !== undefined) {
      query.resolved = filters.resolved;
    }
    if (filters?.adminUserId && Types.ObjectId.isValid(filters.adminUserId)) {
      query.adminUserId = new Types.ObjectId(filters.adminUserId);
    }

    try {
      const storedAlerts = await this.securityAlertModel
        .find(query)
        .sort({ timestamp: -1 })
        .limit(500)
        .exec();

      const alerts = storedAlerts.map((alert) => this.mapStoredAlert(alert));
      for (const alert of alerts) {
        this.alerts.set(alert.id!, alert);
      }

      return alerts;
    } catch (error) {
      this.logger.error('Failed to list persisted security alerts; returning in-memory alerts:', error);
      return this.getAlerts(filters);
    }
  }

  /**
   * Get one security alert by id from memory or durable store.
   */
  async getAlertById(alertId: string): Promise<SecurityAlert | null> {
    const inMemoryAlert = this.alerts.get(alertId);
    if (inMemoryAlert) {
      return inMemoryAlert;
    }

    if (!Types.ObjectId.isValid(alertId)) {
      return null;
    }

    try {
      const storedAlert = await this.securityAlertModel.findById(alertId).exec();
      if (!storedAlert) {
        return null;
      }

      const alert = this.mapStoredAlert(storedAlert);
      this.alerts.set(alert.id!, alert);
      return alert;
    } catch (error) {
      this.logger.error(`Failed to load security alert ${alertId}:`, error);
      return null;
    }
  }

  /**
   * Resolve a security alert
   */
  async resolveAlert(alertId: string, resolvedBy: string, notes?: string): Promise<void> {
    const alert = await this.getAlertById(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    if (!Types.ObjectId.isValid(resolvedBy)) {
      throw new Error('Invalid resolving admin user id');
    }

    const resolvedAt = new Date();
    const resolvedByObjectId = new Types.ObjectId(resolvedBy);

    alert.resolved = true;
    alert.resolvedBy = resolvedByObjectId;
    alert.resolvedAt = resolvedAt;
    alert.resolutionNotes = notes;
    this.alerts.set(alertId, alert);

    await this.securityAlertModel
      .findByIdAndUpdate(
        alertId,
        {
          $set: {
            resolved: true,
            resolvedBy: resolvedByObjectId,
            resolvedAt,
            resolutionNotes: notes,
          },
        },
        { new: true },
      )
      .exec();

    this.logger.log(`Security alert resolved: ${alertId} by ${resolvedBy}`);
  }

  /**
   * Get security statistics
   */
  getSecurityStatistics(): {
    totalAlerts: number;
    alertsBySeverity: Record<AlertSeverity, number>;
    alertsByType: Record<SecurityAlertType, number>;
    unresolvedAlerts: number;
    alertsLast24Hours: number;
  } {
    const alerts = Array.from(this.alerts.values());
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const alertsBySeverity = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<AlertSeverity, number>);

    const alertsByType = alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<SecurityAlertType, number>);

    return {
      totalAlerts: alerts.length,
      alertsBySeverity,
      alertsByType,
      unresolvedAlerts: alerts.filter(alert => !alert.resolved).length,
      alertsLast24Hours: alerts.filter(alert => alert.timestamp >= last24Hours).length,
    };
  }

  private async hydrateOpenAlertsFromStore(): Promise<void> {
    try {
      const storedAlerts = await this.securityAlertModel
        .find({ resolved: false })
        .sort({ timestamp: -1 })
        .limit(500)
        .exec();

      for (const storedAlert of storedAlerts) {
        const alert = this.mapStoredAlert(storedAlert);
        this.alerts.set(alert.id!, alert);
      }
    } catch (error) {
      this.logger.error('Failed to hydrate security alerts from store:', error);
    }
  }

  private mapStoredAlert(alert: SecurityAlertDocument | any): SecurityAlert {
    const raw = typeof alert.toObject === 'function' ? alert.toObject() : alert;
    const id = String(raw._id || raw.id);

    return {
      id,
      type: raw.type,
      severity: raw.severity,
      adminUserId: new Types.ObjectId(String(raw.adminUserId)),
      title: raw.title,
      description: raw.description,
      metadata: raw.metadata || {},
      timestamp: raw.timestamp instanceof Date ? raw.timestamp : new Date(raw.timestamp),
      resolved: Boolean(raw.resolved),
      resolvedBy: raw.resolvedBy ? new Types.ObjectId(String(raw.resolvedBy)) : undefined,
      resolvedAt: raw.resolvedAt ? new Date(raw.resolvedAt) : undefined,
      resolutionNotes: raw.resolutionNotes,
    };
  }

  /**
   * Start periodic monitoring processes
   */
  private startPeriodicMonitoring(): void {
    // Run security checks every 5 minutes
    this.periodicSecurityChecksTimer = setInterval(async () => {
      try {
        await this.performPeriodicSecurityChecks();
      } catch (error) {
        this.logger.error('Error in periodic security checks:', error);
      }
    }, 5 * 60 * 1000);

    // Clean up old alerts every hour
    this.alertCleanupTimer = setInterval(() => {
      this.cleanupOldAlerts();
    }, 60 * 60 * 1000);
  }

  /**
   * Perform periodic security checks
   */
  private async performPeriodicSecurityChecks(): Promise<void> {
    // Check for dormant admin accounts that suddenly become active
    await this.checkDormantAccountActivity();
    
    // Check for geographic anomalies if enabled
    if (this.config.enableGeographicMonitoring) {
      await this.checkGeographicAnomalies();
    }
  }

  /**
   * Check for dormant account activity
   */
  private async checkDormantAccountActivity(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find admin users who were inactive for 30 days but active in last 24 hours
    const recentlyActiveAdmins = await this.auditLogModel.aggregate([
      {
        $match: {
          timestamp: { $gte: oneDayAgo },
        },
      },
      {
        $group: {
          _id: '$adminUserId',
          recentActions: { $sum: 1 },
        },
      },
    ]);

    for (const admin of recentlyActiveAdmins) {
      const oldActivity = await this.auditLogModel.countDocuments({
        adminUserId: admin._id,
        timestamp: { $gte: thirtyDaysAgo, $lt: oneDayAgo },
      });

      if (oldActivity === 0 && admin.recentActions > 5) {
        await this.createAlert({
          type: SecurityAlertType.UNUSUAL_ACTIVITY_PATTERN,
          severity: AlertSeverity.MEDIUM,
          adminUserId: admin._id,
          title: 'Dormant Account Suddenly Active',
          description: `Admin account that was inactive for 30 days suddenly performed ${admin.recentActions} actions`,
          metadata: {
            recentActions: admin.recentActions,
            dormantPeriod: 30,
          },
          timestamp: new Date(),
          resolved: false,
        });
      }
    }
  }

  /**
   * Check for geographic anomalies
   */
  private async checkGeographicAnomalies(): Promise<void> {
    // This would require IP geolocation service integration
    // For now, we'll just log that the check would happen here
    this.logger.debug('Geographic anomaly check would run here with IP geolocation service');
  }

  /**
   * Clean up old resolved alerts
   */
  private cleanupOldAlerts(): void {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt < sevenDaysAgo) {
        this.alerts.delete(alertId);
      }
    }

    this.securityAlertModel
      .deleteMany({
        resolved: true,
        resolvedAt: { $lt: sevenDaysAgo },
      })
      .exec()
      .catch((error) => this.logger.error('Failed to clean up old persisted security alerts:', error));
  }

  /**
   * Check if notification should be sent for given severity
   */
  private shouldNotifyForSeverity(severity: AlertSeverity): boolean {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return this.config.notifyOnCritical;
      case AlertSeverity.HIGH:
        return this.config.notifyOnHigh;
      default:
        return false;
    }
  }
}
