import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum SecurityAlertType {
  SUSPICIOUS_LOGIN = 'suspicious_login',
  MULTIPLE_FAILED_ATTEMPTS = 'multiple_failed_attempts',
  UNUSUAL_ACTIVITY_PATTERN = 'unusual_activity_pattern',
  BULK_OPERATION_ABUSE = 'bulk_operation_abuse',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_EXPORT_ABUSE = 'data_export_abuse',
  AFTER_HOURS_ACCESS = 'after_hours_access',
  GEOGRAPHIC_ANOMALY = 'geographic_anomaly',
  HIGH_VOLUME_ACTIONS = 'high_volume_actions',
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export type SecurityAlertDocument = HydratedDocument<SecurityAlert>;

@Schema({
  collection: 'security_alerts',
  timestamps: true,
})
export class SecurityAlert {
  @Prop({ required: true, type: String, enum: Object.values(SecurityAlertType), index: true })
  type: SecurityAlertType;

  @Prop({ required: true, type: String, enum: Object.values(AlertSeverity), index: true })
  severity: AlertSeverity;

  @Prop({ required: true, type: Types.ObjectId, ref: 'AdminUser', index: true })
  adminUserId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 180 })
  title: string;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  description: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ required: true, type: Date, default: Date.now, index: true })
  timestamp: Date;

  @Prop({ required: true, default: false, index: true })
  resolved: boolean;

  @Prop({ type: Types.ObjectId, ref: 'AdminUser' })
  resolvedBy?: Types.ObjectId;

  @Prop({ type: Date })
  resolvedAt?: Date;

  @Prop({ trim: true, maxlength: 2000 })
  resolutionNotes?: string;
}

export const SecurityAlertSchema = SchemaFactory.createForClass(SecurityAlert);

SecurityAlertSchema.index({ resolved: 1, severity: 1, timestamp: -1 });
SecurityAlertSchema.index({ adminUserId: 1, resolved: 1, timestamp: -1 });
SecurityAlertSchema.index({ type: 1, timestamp: -1 });
