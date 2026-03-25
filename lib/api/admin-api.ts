/**
 * Admin API Client
 * Comprehensive API client for all admin module endpoints
 */

import { apiClient } from '../api-client';

// ==================== TYPES & INTERFACES ====================

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = Record<string, JsonValue>;

export interface AdminApiSuccessEnvelope<T> {
  success?: boolean;
  message?: string;
  data: T;
}

export interface AdminPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface AdminPaginatedData<T> {
  items: T[];
  pagination: AdminPagination;
}

export interface AdminApiPaginatedResponse<T> {
  data: {
    items: T[];
    pagination: AdminPagination;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminApiListAliasResponse<T, TKey extends string> extends AdminApiPaginatedResponse<T> {
  data: AdminApiPaginatedResponse<T>['data'] & Record<TKey, T[]>;
}

export interface AdminEntityRef {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
}

export interface AdminUserSummary extends AdminEntityRef {
  status?: string;
  role?: string;
  roles?: string[];
  createdAt?: string;
}

export interface AdminCommunitySummary extends AdminEntityRef {
  slug?: string;
  status?: string;
  creator?: AdminEntityRef | null;
  createdAt?: string;
}

export interface AdminModerationItem {
  _id: string;
  contentType?: string;
  status?: string;
  priority?: string;
  assignedTo?: AdminEntityRef | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: JsonValue | AdminEntityRef | AdminEntityRef[] | null | undefined;
}

export interface AdminSubscriptionSummary {
  _id: string;
  user: AdminEntityRef | null;
  creator: AdminEntityRef | null;
  community?: JsonObject | null;
  status?: string;
  planTier?: string;
  nextBillingDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  [key: string]: JsonValue | JsonObject | AdminEntityRef | null | undefined;
}

export interface AdminTransactionSummary {
  _id: string;
  user?: JsonObject | null;
  type?: string;
  amount?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
  [key: string]: JsonValue | JsonObject | null | undefined;
}

export interface AdminPayoutSummary {
  _id: string;
  creator: AdminEntityRef | null;
  community?: JsonObject | null;
  amount?: number;
  currency?: string;
  status?: string;
  method?: string;
  initiatedAt?: string;
  [key: string]: JsonValue | JsonObject | AdminEntityRef | null | undefined;
}

export interface AdminAuditLog {
  _id: string;
  action: string;
  entityType: string;
  entityId: string;
  adminUser: {
    _id: string;
    name: string;
  };
  ipAddress: string;
  userAgent: string;
  changes: JsonObject | null;
  timestamp: string;
  status: string;
}

export interface AdminSecurityEvent {
  _id: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress?: string;
  userId?: string;
  resolved: boolean;
  resolvedBy?: {
    _id: string;
    name: string;
  };
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AdminSecurityConfig {
  maxFailedLogins?: number;
  failedLoginTimeWindow?: number;
  maxActionsPerHour?: number;
  maxBulkOperationsPerDay?: number;
  maxDataExportsPerDay?: number;
  businessHoursStart?: number;
  businessHoursEnd?: number;
  enableGeographicMonitoring?: boolean;
  allowedCountries?: string[];
  notifyOnCritical?: boolean;
  notifyOnHigh?: boolean;
  alertRecipients?: string[];
}

export interface AdminSecurityNotificationStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

export interface AdminSecurityAuditReport {
  summary: Record<string, JsonValue | JsonObject | null | undefined>;
  alerts: AdminSecurityEvent[];
  recommendations: string[];
  riskScore: number;
}

export interface AdminComplianceReport {
  auditLogRetention: boolean;
  accessControlImplemented: boolean;
  securityMonitoringActive: boolean;
  alertNotificationsConfigured: boolean;
  dataExportTracking: boolean;
  complianceScore: number;
  recommendations: string[];
}

export interface AdminIncidentReport {
  incident: AdminSecurityEvent;
  relatedLogs: AdminAuditLog[];
  timeline: Array<Record<string, JsonValue | JsonObject | null | undefined>>;
  impact: string;
  recommendations: string[];
}

export interface AdminCampaign {
  _id: string;
  name: string;
  title: string;
  subject?: string;
  content?: string;
  targetAudience?: string;
  customAudienceIds?: string[];
  createdBy: AdminEntityRef;
  analytics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
  [key: string]: JsonValue | JsonObject | AdminEntityRef | string[] | null | undefined;
}

export interface AdminEmailTemplate {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  subject?: string;
  content?: string;
  variables?: string[];
  isActive?: boolean;
}

export interface AdminTemplateVersion {
  version: number;
  subject: string;
  content: string;
  variables: string[];
  createdAt: string;
  createdBy?: AdminEntityRef | null;
}

export interface AdminTemplatePreview {
  subject: string;
  content: string;
  variables: string[];
}

export interface AdminNotificationConfig {
  _id: string;
  name: string;
  title: string;
  description?: string;
  type?: string;
  channels: string[];
  enabled: boolean;
  isCritical: boolean;
  allowUserDisable?: boolean;
  cooldownMinutes?: number;
  metadata?: Record<string, JsonValue>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminNotificationDeliveryStats {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  deliveryRate: number;
  readRate: number;
  byType: Array<{
    type: string;
    sent: number;
    delivered: number;
    read: number;
    deliveryRate: number;
    readRate: number;
  }>;
}

// Admin Auth Types
export interface AdminLoginDto {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface AdminVerify2FADto {
  email: string;
  verificationCode: string;
}

export interface AdminLoginResponse {
  access_token: string;
  refresh_token: string;
  requires2FA?: boolean;
  message?: string;
  admin?: {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
    twoFactorEnabled?: boolean;
  };
  roles?: string[];
  permissions?: string[];
  capabilities?: AdminCapabilities;
  rememberMe?: boolean;
}

export interface AdminCapabilities {
  dashboard: boolean;
  users: boolean;
  communities: boolean;
  contentModeration: boolean;
  contentManagement: boolean;
  financial: boolean;
  analytics: boolean;
  security: boolean;
  communication: boolean;
  liveSupport: boolean;
  settings: boolean;
}

export interface AdminSessionResponse {
  admin: {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string | Date;
    twoFactorEnabled?: boolean;
  };
  roles: string[];
  permissions: string[];
  capabilities: AdminCapabilities;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface UpdateAdminProfileDto {
  name?: string;
  email?: string;
}

export interface ChangeAdminPasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface AdminPreferences {
  theme: 'light' | 'dark' | 'system';
  locale: string;
  timezone: string;
  emailNotifications: boolean;
}

export interface UpdateAdminPreferencesDto {
  theme?: 'light' | 'dark' | 'system';
  locale?: string;
  timezone?: string;
  emailNotifications?: boolean;
}

export type AdminAlertMetricType =
  | 'user_growth'
  | 'engagement_rate'
  | 'revenue'
  | 'error_rate'
  | 'response_time'
  | 'churn_rate'
  | 'system_health'
  | 'pending_content'
  | 'flagged_content'
  | 'pending_communities'
  | 'failed_logins'
  | 'high_value_transaction';

export interface AdminAlertConfig {
  id: string;
  name: string;
  description: string;
  metricType: AdminAlertMetricType;
  condition: 'greater_than' | 'less_than' | 'equals' | 'change_percentage';
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  isEnabled: boolean;
  notifyAdmins: string[];
  notifyEmails: string[];
  triggerCount: number;
  lastTriggered?: string | Date;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type AdminNotificationCategory =
  | 'pending_moderation'
  | 'pending_communities'
  | 'security_alerts'
  | 'live_support_queue'
  | 'analytics_threshold_alerts';

export interface AdminNotificationSummaryItem {
  category: AdminNotificationCategory;
  count: number;
  label: string;
  href: string;
}

export interface AdminNotificationSummary {
  total: number;
  items: AdminNotificationSummaryItem[];
  generatedAt: string;
}

export interface AdminNotificationFeedItem {
  id: string;
  category: AdminNotificationCategory;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  href: string;
  count?: number;
  createdAt: string;
  metadata?: Record<string, JsonValue>;
}

export interface AdminNotificationFeed {
  items: AdminNotificationFeedItem[];
  total: number;
  generatedAt: string;
}

export type AdminExportType =
  | 'users'
  | 'communities'
  | 'content'
  | 'financial'
  | 'audit_logs'
  | 'analytics';

export type AdminExportFormat = 'csv' | 'excel' | 'pdf' | 'json';

export type AdminExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';

export interface AdminExportJob {
  id: string;
  type: AdminExportType;
  format: AdminExportFormat;
  status: AdminExportStatus;
  progress: number;
  downloadUrl?: string;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  fileSize?: number;
  recordCount?: number;
}

export interface CreateAdminExportJobDto {
  type: AdminExportType;
  format: AdminExportFormat;
  filters?: Record<string, JsonValue>;
  fields?: string[];
}

export interface AdminExportJobList {
  jobs: AdminExportJob[];
  total: number;
}

export type AdminBulkOperationStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'partially_completed'
  | 'cancelled';

export interface AdminBulkOperationFailure {
  itemId: string;
  error: string;
  code?: string;
}

export interface AdminBulkOperationProgress {
  operationId: string;
  status: AdminBulkOperationStatus;
  totalItems: number;
  processedItems: number;
  successCount: number;
  failureCount: number;
  progressPercentage: number;
  startedAt: string;
  completedAt?: string;
  estimatedTimeRemaining?: number;
  failures?: AdminBulkOperationFailure[];
  errorMessage?: string;
}

export interface AdminValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    value?: JsonValue;
    message: string;
    code?: string;
  }>;
  warnings?: Array<{
    field: string;
    value?: JsonValue;
    message: string;
    code?: string;
  }>;
  sanitizedData?: Record<string, JsonValue>;
}

// User Management Types
export interface UserFilters {
  page?: number;
  limit?: number;
  status?: 'active' | 'suspended' | 'deleted';
  roles?: string;
  searchTerm?: string;
  registeredFrom?: string;
  registeredTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserDetails {
  user: AdminUserSummary & Record<string, JsonValue | JsonObject | null | undefined>;
  activityHistory: JsonObject[];
  subscriptions: JsonObject[];
  communities: JsonObject[];
  statistics: {
    totalSpent: number;
    totalCommunities: number;
    totalCourses: number;
    accountAge: number;
  };
}

export interface SuspendUserDto {
  reason: string;
  endDate?: Date;
  notifyUser?: boolean;
}

export interface ActivateUserDto {
  reason: string;
  notifyUser?: boolean;
}

export interface ResetUserPasswordDto {
  sendEmail?: boolean;
  temporaryPassword?: string;
}

export interface CreateAdminUserDto {
  name: string;
  email: string;
  password: string;
  role?: string;
  status?: 'active' | 'suspended' | 'deleted';
  [key: string]: JsonValue | JsonObject | null | undefined;
}

export interface UpdateAdminUserDto {
  name?: string;
  email?: string;
  role?: string;
  status?: 'active' | 'suspended' | 'deleted';
  [key: string]: JsonValue | JsonObject | null | undefined;
}

// Community Management Types
export interface CommunityFilters {
  page?: number;
  limit?: number;
  status?: 'pending' | 'pending_approval' | 'approved' | 'rejected' | 'active' | 'inactive' | 'suspended';
  searchTerm?: string;
  createdAfter?: string;
  createdBefore?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApproveCommunityDto {
  approvalNotes?: string;
  featured?: boolean;
  verified?: boolean;
}

export interface RejectCommunityDto {
  rejectionReason: string;
  notifyCreator?: boolean;
}

export interface BulkCommunityApprovalDto {
  communityIds: string[];
  action: 'approve' | 'reject';
  reason?: string;
  notes?: string;
}

export interface CommunityModerationDto {
  featured?: boolean;
  verified?: boolean;
  isActive?: boolean;
  adminNotes?: string;
}

export interface AdminListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: JsonValue | undefined;
}

// Content Moderation Types
export interface ContentModerationFilters {
  page?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'flagged';
  contentType?: 'post' | 'comment' | 'course' | 'event' | 'product';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  reportedFrom?: string;
  reportedTo?: string;
}

export interface ModerateContentDto {
  action: 'approve' | 'reject' | 'flag' | 'escalate';
  reason?: string;
  notes?: string;
  notifyUser?: boolean;
}

export interface BulkModerateContentDto {
  itemIds: string[];
  action: 'approve' | 'reject' | 'flag';
  reason?: string;
  notes?: string;
}

// Financial Management Types
export interface RevenueDashboardQuery {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}

export interface SubscriptionFilters {
  page?: number;
  limit?: number;
  status?: string | string[];
  plan?: string | string[];
  planTier?: string;
  creatorId?: string;
  subscriberId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  cancelAtPeriodEnd?: boolean;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: string;
  userId?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  reference?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CalculatePayoutDto {
  communityId: string;
  creatorId: string;
  startDate: string;
  endDate: string;
}

export interface InitiatePayoutDto {
  communityId: string;
  creatorId: string;
  amount: number;
  currency: string;
  method: 'bank_transfer' | 'paypal' | 'stripe';
  notes?: string;
}

export interface PayoutFilters {
  page?: number;
  limit?: number;
  status?: string | string[];
  method?: string | string[];
  creatorId?: string;
  communityId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProcessPayoutDto {
  transactionReference?: string;
  notes?: string;
}

export interface UpdatePayoutStatusDto {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  notes?: string;
}

export interface AdminPayoutBankCredentials {
  rib?: string | null;
  bankName?: string | null;
  ownerName?: string | null;
  countryCode?: string | null;
}

export interface AdminPayoutDetails {
  _id: string;
  creator: {
    _id: string;
    username: string;
    email: string;
  };
  community: {
    _id: string;
    name: string;
    slug?: string;
  };
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  method: 'bank_transfer' | 'paypal' | 'stripe';
  initiatedAt: string;
  processedAt?: string;
  transactionReference?: string | null;
  notes?: string | null;
  createdBy?: {
    _id: string;
    name: string;
  };
  bankCredentials?: AdminPayoutBankCredentials | null;
  bankAccount?: AdminPayoutBankCredentials | null;
}

// Analytics Types
export interface AnalyticsPeriodDto {
  startDate?: string;
  endDate?: string;
  granularity?: 'day' | 'week' | 'month' | 'year';
}

export interface AdminAnalyticsReportRequest {
  type?: 'executive' | 'performance' | 'engagement' | 'revenue' | 'health' | 'comparative';
  format?: 'json' | 'csv' | 'pdf';
  startDate?: string;
  endDate?: string;
  includeCharts?: boolean;
  includeComparative?: boolean;
}

export interface FinancialAnalyticsQuery {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}

// Security Audit Types
export interface AuditLogFilters {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  entityId?: string;
  adminUserId?: string;
  status?: string;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  ipAddress?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SecurityEventFilters {
  page?: number;
  limit?: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  eventType?: string;
  resolved?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface LiveSupportAdminFilters {
  view?: 'available' | 'mine' | 'closed';
  search?: string;
  page?: number;
  limit?: number;
}

// Communication Management Types
export interface CreateEmailCampaignDto {
  title: string;
  subject: string;
  content: string;
  type: 'announcement' | 'newsletter' | 'promotion' | 'event_reminder' | 'course_update' | 'custom';
  audienceTarget: 'all_users' | 'community_members' | 'active_users' | 'inactive_users' | 'specific_users' | 'user_role';
  communityId?: string;
  specificUserIds?: string[];
  targetRoles?: string[];
  scheduledAt?: Date;
  templateId?: string;
  isHtml?: boolean;
  trackOpens?: boolean;
  trackClicks?: boolean;
  personalizationVariables?: Record<string, JsonValue>;
  metadata?: Record<string, JsonValue>;
}

// Temporary compatibility input for legacy admin UI forms.
export interface LegacyCreateEmailCampaignDto {
  name: string;
  subject: string;
  content: string;
  targetAudience: 'all' | 'creators' | 'members' | 'custom';
  customAudienceIds?: string[];
  scheduledAt?: Date;
  templateId?: string;
}

export interface BulkMessageDto {
  title: string;
  content: string;
  channel: 'email' | 'in_app' | 'both';
  audienceTarget: 'all_users' | 'community_members' | 'active_users' | 'inactive_users' | 'specific_users' | 'user_role';
  communityId?: string;
  specificUserIds?: string[];
  targetRoles?: string[];
  personalizationVariables?: Record<string, JsonValue>;
  metadata?: Record<string, JsonValue>;
}

export interface CreateEmailTemplateDto {
  name: string;
  description: string;
  category: 'welcome' | 'announcement' | 'newsletter' | 'transactional' | 'marketing' | 'notification' | 'custom';
  subject: string;
  content: string;
  variables?: string[];
  isActive?: boolean;
  tags?: string[];
  metadata?: Record<string, JsonValue>;
}

type UnknownResponse = unknown;
type UnknownRecord = Record<string, unknown>;
type PaginationInput = { page?: number; limit?: number };

export type AdminNormalizedPaginated<T> = {
  items: T[];
  data: T[];
  pagination: AdminPagination;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

const getResponseRoot = (response: UnknownResponse): UnknownRecord =>
  response && typeof response === 'object' ? (response as UnknownRecord) : {};
const getResponseData = <T = unknown>(response: UnknownResponse): T | undefined => {
  const root = getResponseRoot(response);
  if ('success' in root && 'data' in root) {
    return root.data as T;
  }
  return root.data as T | undefined;
};

const toArray = <T = unknown>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  return [];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asRecord = (value: unknown): UnknownRecord => (isRecord(value) ? value : {});
const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;
const asBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === 'boolean' ? value : fallback;
const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return fallback;
};

const toEntityRef = (value: unknown, fallbackLabel: string): AdminEntityRef | null => {
  if (!isRecord(value)) return null;

  return {
    _id: String(value._id ?? value.id ?? ''),
    name: typeof value.name === 'string' ? value.name : undefined,
    username:
      typeof value.username === 'string'
        ? value.username
        : typeof value.userId === 'string'
        ? value.userId
        : typeof value.email === 'string'
        ? value.email
        : fallbackLabel,
    email: typeof value.email === 'string' ? value.email : undefined,
  };
};

const extractListCandidate = <T = unknown>(payload: unknown, candidates: string[]): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  const record = asRecord(payload);
  const nested = asRecord(record.data);
  const containers: UnknownRecord[] = [record, nested];

  for (const container of containers) {
    for (const key of candidates) {
      const candidate = container[key];
      if (Array.isArray(candidate)) {
        return candidate as T[];
      }
    }
  }

  return [];
};

const extractPagination = (
  root: UnknownResponse,
  payload: unknown,
  fallback: PaginationInput = {},
  totalOverride?: number,
): AdminPagination => {
  const rootRecord = getResponseRoot(root);
  const rootPagination = isRecord(rootRecord.pagination) ? rootRecord.pagination : null;
  const payloadRecord = isRecord(payload) ? payload : null;
  const nestedPayload = isRecord(payloadRecord?.data) ? payloadRecord.data : null;

  const page = asNumber(
    rootPagination?.page ??
      rootRecord.page ??
      payloadRecord?.page ??
      nestedPayload?.page ??
      fallback.page ??
      1,
    1,
  );
  const limit = asNumber(
    rootPagination?.limit ??
      rootRecord.limit ??
      payloadRecord?.limit ??
      nestedPayload?.limit ??
      fallback.limit ??
      20,
    20,
  );
  const total = asNumber(
    totalOverride ??
      rootPagination?.total ??
      rootRecord.total ??
      payloadRecord?.total ??
      nestedPayload?.total ??
      0,
    0,
  );
  const totalPages = asNumber(
    rootPagination?.totalPages ??
      rootRecord.totalPages ??
      payloadRecord?.totalPages ??
      nestedPayload?.totalPages ??
      Math.max(1, Math.ceil(total / Math.max(limit, 1))),
    Math.max(1, Math.ceil(total / Math.max(limit, 1))),
  );

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage:
      typeof payloadRecord?.hasNextPage === 'boolean'
        ? payloadRecord.hasNextPage
        : typeof nestedPayload?.hasNextPage === 'boolean'
        ? nestedPayload.hasNextPage
        : page < totalPages,
    hasPrevPage:
      typeof payloadRecord?.hasPrevPage === 'boolean'
        ? payloadRecord.hasPrevPage
        : typeof nestedPayload?.hasPrevPage === 'boolean'
        ? nestedPayload.hasPrevPage
        : page > 1,
  };
};

const buildPaginatedPayload = <T, Alias extends string = never>(
  items: T[],
  pagination: AdminPagination,
  aliases: Alias[] = [],
): AdminNormalizedPaginated<T> & Record<Alias, T[]> => {
  const payload: AdminNormalizedPaginated<T> = {
    items,
    data: items,
    pagination,
    total: pagination.total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: pagination.totalPages,
    hasNextPage: Boolean(pagination.hasNextPage),
    hasPrevPage: Boolean(pagination.hasPrevPage),
  };

  for (const alias of aliases) {
    (payload as UnknownRecord)[alias] = items;
  }

  return payload as AdminNormalizedPaginated<T> & Record<Alias, T[]>;
};

const toPaginatedResult = <T, Alias extends string = never>(
  response: UnknownResponse,
  items: T[],
  fallback: PaginationInput = {},
  aliases: Alias[] = [],
  totalOverride?: number,
  includeTopLevelPagination = false,
) => {
  const payload = getResponseData(response);
  const pagination = extractPagination(response, payload, fallback, totalOverride);

  const root = {
    ...getResponseRoot(response),
    data: buildPaginatedPayload(items, pagination, aliases),
  };

  if (!includeTopLevelPagination) return root;

  return {
    ...root,
    pagination,
  };
};

const legacyAudienceToCanonical = (
  targetAudience?: 'all' | 'creators' | 'members' | 'custom',
): {
  audienceTarget: CreateEmailCampaignDto['audienceTarget'];
  specificUserIds?: string[];
  targetRoles?: string[];
} => {
  switch (targetAudience) {
    case 'creators':
      return { audienceTarget: 'user_role', targetRoles: ['creator'] };
    case 'members':
      return { audienceTarget: 'user_role', targetRoles: ['user'] };
    case 'custom':
      return { audienceTarget: 'specific_users' };
    case 'all':
    default:
      return { audienceTarget: 'all_users' };
  }
};

const normalizeCampaign = (campaign: UnknownRecord | null | undefined): AdminCampaign | null => {
  if (!campaign) return campaign as null;

  const metadata = asRecord(campaign.metadata);
  const rawAudienceTarget = asString(metadata.audienceTarget, asString(metadata.targetAudience, 'all_users'));
  const targetAudience =
    rawAudienceTarget === 'user_role'
      ? toArray<string>(metadata.targetRoles).includes('creator')
        ? 'creators'
        : 'members'
      : rawAudienceTarget === 'specific_users'
      ? 'custom'
      : rawAudienceTarget === 'community_members'
      ? 'members'
      : rawAudienceTarget === 'active_users' || rawAudienceTarget === 'inactive_users'
      ? 'all'
      : rawAudienceTarget === 'all_users'
      ? 'all'
      : rawAudienceTarget;
  const customAudienceIds = toArray<string>(metadata.specificUserIds).length
    ? toArray<string>(metadata.specificUserIds)
    : toArray<string>(metadata.customAudienceIds);

  const createdBy =
    isRecord(campaign.creatorId)
      ? campaign.creatorId
      : isRecord(campaign.createdBy)
      ? campaign.createdBy
      : null;

  return {
    ...campaign,
    _id: String(campaign._id ?? ''),
    name: asString(campaign.name, asString(campaign.title)),
    title: asString(campaign.title, asString(campaign.name)),
    targetAudience,
    customAudienceIds,
    createdBy: createdBy
      ? {
          _id: String(createdBy._id ?? ''),
          name: asString(createdBy.name, asString(createdBy.username, 'Admin')),
          email: asString(createdBy.email),
        }
      : {
          _id: '',
          name: 'Admin',
          email: '',
        },
    analytics: {
      sent: asNumber(campaign.totalRecipients, asNumber(campaign.sentCount, 0)),
      delivered: asNumber(campaign.sentCount, 0),
      opened: asNumber(campaign.openCount, 0),
      clicked: asNumber(campaign.clickCount, 0),
      bounced: toArray<unknown>(campaign.recipients).filter((recipient) => asString(asRecord(recipient).status) === 'bounced').length,
      unsubscribed: 0,
    },
  };
};

const normalizeTemplate = (template: UnknownRecord): AdminEmailTemplate => ({
  ...template,
  _id: asString(template._id),
  name: asString(template.name),
  description: asString(template.description),
  category: asString(template.category),
  subject: asString(template.subject),
  content: asString(template.content),
  variables: toArray<string>(template.variables),
  isActive: asBoolean(template.isActive, false),
});

const normalizeTemplateVersion = (version: unknown): AdminTemplateVersion => {
  const raw = asRecord(version);
  const createdBy = toEntityRef(raw.createdBy, 'Admin');
  return {
    version: asNumber(raw.version),
    subject: asString(raw.subject),
    content: asString(raw.content),
    variables: toArray<string>(raw.variables),
    createdAt: asString(raw.createdAt),
    createdBy,
  };
};

const normalizeNotificationConfig = (config: unknown): AdminNotificationConfig => {
  const raw = asRecord(config);
  return {
    ...raw,
    _id: asString(raw._id),
    name: asString(raw.name),
    title: asString(raw.title, asString(raw.name)),
    description: asString(raw.description),
    type: asString(raw.type),
    channels: toArray<string>(raw.channels),
    enabled: asBoolean(raw.enabled, true),
    isCritical: asBoolean(raw.isCritical, false),
    allowUserDisable: asBoolean(raw.allowUserDisable, true),
    cooldownMinutes: asNumber(raw.cooldownMinutes, 0),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    metadata: asRecord(raw.metadata) as Record<string, JsonValue>,
  };
};

const toCanonicalCampaignPayload = (
  data: CreateEmailCampaignDto | LegacyCreateEmailCampaignDto,
): CreateEmailCampaignDto => {
  if ('audienceTarget' in data) {
    return {
      ...data,
      type: data.type || 'custom',
    };
  }

  const mapping = legacyAudienceToCanonical(data.targetAudience);

  return {
    title: data.name,
    subject: data.subject,
    content: data.content,
    type: 'custom',
    audienceTarget: mapping.audienceTarget,
    specificUserIds:
      mapping.audienceTarget === 'specific_users' ? data.customAudienceIds || [] : undefined,
    targetRoles: mapping.targetRoles,
    scheduledAt: data.scheduledAt,
    templateId: data.templateId,
    isHtml: true,
    trackOpens: true,
    trackClicks: true,
  };
};

const toCanonicalCampaignPatchPayload = (
  data: Partial<CreateEmailCampaignDto | LegacyCreateEmailCampaignDto>,
): UnknownRecord => {
  if ('audienceTarget' in data || 'title' in data || 'type' in data) {
    return { ...data };
  }

  const payload: UnknownRecord = {};
  if ('name' in data) payload.title = data.name;
  if ('subject' in data) payload.subject = data.subject;
  if ('content' in data) payload.content = data.content;
  if ('scheduledAt' in data) payload.scheduledAt = data.scheduledAt;
  if ('templateId' in data) payload.templateId = data.templateId;
  if ('targetAudience' in data) {
    const mapping = legacyAudienceToCanonical(data.targetAudience);
    payload.audienceTarget = mapping.audienceTarget;
    if (mapping.targetRoles) payload.targetRoles = mapping.targetRoles;
    if (mapping.audienceTarget === 'specific_users') {
      payload.specificUserIds = data.customAudienceIds || [];
    }
  }
  return payload;
};

const toCanonicalBulkMessagePayload = (data: BulkMessageDto | UnknownRecord): BulkMessageDto => {
  if (data?.audienceTarget) {
    return data as BulkMessageDto;
  }

  const legacy = asRecord(data);
  return {
    title: asString(legacy.subject, 'Bulk Message'),
    content: asString(legacy.message),
    channel: 'both',
    audienceTarget: 'specific_users',
    specificUserIds: toArray<string>(legacy.recipientIds),
    metadata: legacy.priority ? { priority: String(legacy.priority) } : undefined,
  };
};

const toCanonicalTemplatePayload = (data: Partial<CreateEmailTemplateDto>): CreateEmailTemplateDto => ({
  name: asString(data.name),
  description: asString(data.description, `Template: ${asString(data.name)}`),
  category: (asString(data.category, 'custom') as CreateEmailTemplateDto['category']),
  subject: asString(data.subject),
  content: asString(data.content),
  variables: toArray<string>(data.variables),
  isActive: data.isActive !== false,
  tags: toArray<string>(data.tags),
  metadata: (asRecord(data.metadata) as Record<string, JsonValue>),
});

const toCanonicalTemplatePatchPayload = (data: Partial<CreateEmailTemplateDto>): UnknownRecord => {
  const payload: UnknownRecord = {};
  if ('name' in data) payload.name = data.name;
  if ('description' in data) payload.description = data.description;
  if ('category' in data) payload.category = data.category;
  if ('subject' in data) payload.subject = data.subject;
  if ('content' in data) payload.content = data.content;
  if ('variables' in data) payload.variables = data.variables || [];
  if ('isActive' in data) payload.isActive = data.isActive;
  if ('tags' in data) payload.tags = data.tags || [];
  if ('metadata' in data) payload.metadata = data.metadata || {};
  return payload;
};

const normalizeAuditLog = (log: unknown): AdminAuditLog => {
  const record = asRecord(log);
  const adminUser = isRecord(record.adminUser) ? record.adminUser : null;

  return {
    _id: String(record._id ?? ''),
    action: asString(record.action, 'unknown'),
    entityType: asString(record.entityType, 'Unknown'),
    entityId: String(record.entityId ?? ''),
    adminUser: {
      _id: adminUser ? String(adminUser._id ?? '') : String(record.adminUserId ?? ''),
      name: adminUser ? asString(adminUser.name, asString(adminUser.userId, 'Admin User')) : 'Admin User',
    },
    ipAddress: asString(record.ipAddress, 'N/A'),
    userAgent: asString(record.userAgent),
    changes: (isRecord(record.newData) ? record.newData : isRecord(record.metadata) ? record.metadata : null) as JsonObject | null,
    timestamp: asString(record.timestamp, asString(record.createdAt, new Date().toISOString())),
    status: asString(record.status, 'success'),
  };
};

const normalizeSecurityEvent = (event: unknown): AdminSecurityEvent => {
  const record = asRecord(event);
  const metadata = asRecord(record.metadata);
  const resolvedBy = asRecord(record.resolvedBy);

  return {
  _id: asString(record.id, asString(record._id)),
  eventType: asString(record.type, asString(record.eventType, 'unknown')),
  severity: (asString(record.severity, 'low') as AdminSecurityEvent['severity']),
  description: asString(record.description, asString(record.title)),
  ipAddress: asString(metadata.ipAddress, asString(record.ipAddress)) || undefined,
  userId: asString(record.adminUserId, asString(record.userId)) || undefined,
  resolved: asBoolean(record.resolved),
  resolvedBy: Object.keys(resolvedBy).length > 0
    ? {
        _id: String(resolvedBy._id ?? record.resolvedBy ?? ''),
        name: asString(resolvedBy.name, 'Admin'),
      }
    : undefined,
  resolution: asString(record.resolutionNotes, asString(record.resolution)) || undefined,
  createdAt: asString(record.timestamp, asString(record.createdAt, new Date().toISOString())),
  resolvedAt: asString(record.resolvedAt) || undefined,
  };
};

const normalizeSecurityMetrics = (stats: unknown) => {
  const base = asRecord(stats);
  const bySeverity = asRecord(base.alertsBySeverity);
  const byType = asRecord(base.alertsByType);
  return {
    totalEvents: asNumber(base.totalAlerts, 0),
    unresolvedEvents: asNumber(base.unresolvedAlerts, 0),
    criticalEvents: asNumber(bySeverity.critical, 0),
    failedLoginAttempts:
      asNumber(byType.multiple_failed_attempts, 0) + asNumber(byType.suspicious_login, 0),
    suspiciousActivities:
      asNumber(byType.unusual_activity_pattern, 0) +
      asNumber(byType.geographic_anomaly, 0) +
      asNumber(byType.privilege_escalation, 0),
  };
};

const normalizeSecurityConfig = (config: unknown): AdminSecurityConfig => {
  const record = asRecord(config);
  return {
    maxFailedLogins: asNumber(record.maxFailedLogins, 0),
    failedLoginTimeWindow: asNumber(record.failedLoginTimeWindow, 0),
    maxActionsPerHour: asNumber(record.maxActionsPerHour, 0),
    maxBulkOperationsPerDay: asNumber(record.maxBulkOperationsPerDay, 0),
    maxDataExportsPerDay: asNumber(record.maxDataExportsPerDay, 0),
    businessHoursStart: asNumber(record.businessHoursStart, 0),
    businessHoursEnd: asNumber(record.businessHoursEnd, 0),
    enableGeographicMonitoring: asBoolean(record.enableGeographicMonitoring, false),
    allowedCountries: toArray<string>(record.allowedCountries),
    notifyOnCritical: asBoolean(record.notifyOnCritical, false),
    notifyOnHigh: asBoolean(record.notifyOnHigh, false),
    alertRecipients: toArray<string>(record.alertRecipients),
  };
};

const normalizeNotificationStats = (stats: unknown): AdminSecurityNotificationStats => {
  const record = asRecord(stats);
  return {
    total: asNumber(record.total, 0),
    sent: asNumber(record.sent, 0),
    failed: asNumber(record.failed, 0),
    pending: asNumber(record.pending, 0),
    byType: asRecord(record.byType) as Record<string, number>,
    bySeverity: asRecord(record.bySeverity) as Record<string, number>,
  };
};

const normalizeAuditReport = (report: unknown): AdminSecurityAuditReport => {
  const record = asRecord(report);
  return {
    summary: asRecord(record.summary) as Record<string, JsonValue | JsonObject | null | undefined>,
    alerts: extractListCandidate<unknown>(record.alerts, ['data', 'items', 'alerts']).map(normalizeSecurityEvent),
    recommendations: toArray<string>(record.recommendations),
    riskScore: asNumber(record.riskScore, 0),
  };
};

const normalizeComplianceReport = (report: unknown): AdminComplianceReport => {
  const record = asRecord(report);
  return {
    auditLogRetention: asBoolean(record.auditLogRetention, false),
    accessControlImplemented: asBoolean(record.accessControlImplemented, false),
    securityMonitoringActive: asBoolean(record.securityMonitoringActive, false),
    alertNotificationsConfigured: asBoolean(record.alertNotificationsConfigured, false),
    dataExportTracking: asBoolean(record.dataExportTracking, false),
    complianceScore: asNumber(record.complianceScore, 0),
    recommendations: toArray<string>(record.recommendations),
  };
};

const normalizeIncidentReport = (report: unknown): AdminIncidentReport => {
  const record = asRecord(report);
  return {
    incident: normalizeSecurityEvent(record.incident),
    relatedLogs: extractListCandidate<unknown>(record.relatedLogs, ['data', 'items', 'logs']).map(normalizeAuditLog),
    timeline: toArray<Record<string, JsonValue | JsonObject | null | undefined>>(record.timeline),
    impact: asString(record.impact),
    recommendations: toArray<string>(record.recommendations),
  };
};

const normalizeExportJob = (job: unknown): AdminExportJob => {
  const record = asRecord(job);
  return {
    id: asString(record.id, asString(record._id)),
    type: asString(record.type, 'users') as AdminExportType,
    format: asString(record.format, 'csv') as AdminExportFormat,
    status: asString(record.status, 'pending') as AdminExportStatus,
    progress: asNumber(record.progress, 0),
    downloadUrl: asString(record.downloadUrl) || undefined,
    createdAt: asString(record.createdAt, new Date().toISOString()),
    completedAt: asString(record.completedAt) || undefined,
    errorMessage: asString(record.errorMessage) || undefined,
    fileSize: 'fileSize' in record ? asNumber(record.fileSize, 0) : undefined,
    recordCount: 'recordCount' in record ? asNumber(record.recordCount, 0) : undefined,
  };
};

const normalizeBulkOperationProgress = (operation: unknown): AdminBulkOperationProgress => {
  const record = asRecord(operation);
  return {
    operationId: asString(record.operationId),
    status: asString(record.status, 'pending') as AdminBulkOperationStatus,
    totalItems: asNumber(record.totalItems, 0),
    processedItems: asNumber(record.processedItems, 0),
    successCount: asNumber(record.successCount, 0),
    failureCount: asNumber(record.failureCount, 0),
    progressPercentage: asNumber(record.progressPercentage, 0),
    startedAt: asString(record.startedAt, new Date().toISOString()),
    completedAt: asString(record.completedAt) || undefined,
    estimatedTimeRemaining:
      'estimatedTimeRemaining' in record ? asNumber(record.estimatedTimeRemaining, 0) : undefined,
    failures: toArray<unknown>(record.failures).map((failure) => {
      const item = asRecord(failure);
      return {
        itemId: asString(item.itemId),
        error: asString(item.error, 'Operation failed'),
        code: asString(item.code) || undefined,
      };
    }),
    errorMessage: asString(record.errorMessage) || undefined,
  };
};

const normalizeValidationResult = (result: unknown): AdminValidationResult => {
  const record = asRecord(result);
  const normalizeIssue = (issue: unknown) => {
    const item = asRecord(issue);
    return {
      field: asString(item.field),
      value: item.value as JsonValue | undefined,
      message: asString(item.message, 'Validation issue'),
      code: asString(item.code) || undefined,
    };
  };

  return {
    isValid: asBoolean(record.isValid, false),
    errors: toArray<unknown>(record.errors).map(normalizeIssue),
    warnings: toArray<unknown>(record.warnings).map(normalizeIssue),
    sanitizedData: asRecord(record.sanitizedData) as Record<string, JsonValue>,
  };
};

/**
 * Backend response contracts used by admin-api normalization.
 * This keeps endpoint expectations explicit and reviewable.
 */
export const ADMIN_ENDPOINT_CONTRACTS = {
  users: {
    list: 'GET /admin/users -> { success, data: { data|items: User[], total, page, limit, totalPages } }',
    detail: 'GET /admin/users/:id -> { success, data: UserDetails }',
  },
  communities: {
    list: 'GET /admin/communities -> { success, data: { data|items: Community[], total, page, limit, totalPages } }',
    pending: 'GET /admin/communities/pending-approvals -> { success, data: { data|items: Community[], total, page, limit, totalPages } }',
  },
  contentModeration: {
    queue: 'GET /admin/content-moderation/queue -> { success, data: ModerationItem[] } + pagination at root or in data',
  },
  financial: {
    subscriptions: 'GET /admin/financial/subscriptions -> envelope or plain { data|items: Subscription[], total, page, limit, totalPages }',
    transactions: 'GET /admin/financial/transactions -> envelope or plain { data|items: Transaction[], total, page, limit, totalPages }',
    payouts: 'GET /admin/financial/payouts -> envelope or plain { data|items: Payout[], total, page, limit, totalPages }',
  },
  security: {
    auditTrail: 'GET /admin/security/audit-trail -> { success, data: AuditLog[], pagination }',
    alerts: 'GET /admin/security/alerts -> { success, data: SecurityAlert[], total? }',
    config: 'GET/PUT /admin/security/config -> { success, data: SecurityConfig }',
    reports: 'GET /admin/security/audit/report | /compliance/report | /incidents/:id/report',
  },
  notifications: {
    summary: 'GET /admin/notifications/summary -> { success, data: { total, items, generatedAt } }',
    feed: 'GET /admin/notifications/feed -> { success, data: { items, total, generatedAt } }',
  },
  communication: {
    campaigns: 'GET /admin/communication/campaigns -> { success, data: { campaigns|data|items: Campaign[], total, page, limit, totalPages } }',
    templates: 'GET /admin/communication/templates -> { success, data: Template[] | { templates|items: Template[] } }',
  },
} as const;

// ==================== API CLIENT ====================

export const adminApi = {
  // ==================== AUTH ====================
  auth: {
    login: (data: AdminLoginDto) =>
      apiClient.post<AdminLoginResponse>('/admin/login', data),

    verify2FA: (data: AdminVerify2FADto) =>
      apiClient.post<AdminLoginResponse>('/admin/verify-2fa', data),

    me: () =>
      apiClient.get<AdminSessionResponse>('/admin/me'),

    refreshToken: (refreshToken?: string) =>
      apiClient.post<AdminSessionResponse>('/admin/refresh', refreshToken ? { refresh_token: refreshToken } : {}),

    logout: () =>
      apiClient.post('/admin/logout'),

    forgotPassword: (email: string) =>
      apiClient.post('/admin/forgot-password', { email }),

    resetPassword: (data: { email: string; verificationCode: string; newPassword: string }) =>
      apiClient.post('/admin/reset-password', data),
  },

  settings: {
    updateProfile: (data: UpdateAdminProfileDto) =>
      apiClient.put<AdminSessionResponse>('/admin/profile', data),

    changePassword: (data: ChangeAdminPasswordDto) =>
      apiClient.post<{ message: string }>('/admin/change-password', data),

    getPreferences: () =>
      apiClient.get<AdminPreferences>('/admin/settings/preferences'),

    updatePreferences: (data: UpdateAdminPreferencesDto) =>
      apiClient.put<AdminPreferences>('/admin/settings/preferences', data),
  },

  notifications: {
    getSummary: async (): Promise<AdminNotificationSummary> => {
      const response = await apiClient.get('/admin/notifications/summary');
      const payload = asRecord(getResponseData(response));
      const items = toArray<unknown>(payload.items).map((item) => {
        const record = asRecord(item);
        return {
          category: asString(record.category, 'pending_moderation') as AdminNotificationCategory,
          count: asNumber(record.count, 0),
          label: asString(record.label, 'Notification'),
          href: asString(record.href, '/admin'),
        };
      });

      return {
        total: asNumber(payload.total, items.reduce((sum, item) => sum + item.count, 0)),
        items,
        generatedAt: asString(payload.generatedAt, new Date().toISOString()),
      };
    },

    getFeed: async (limit = 8): Promise<AdminNotificationFeed> => {
      const response = await apiClient.get('/admin/notifications/feed', { limit });
      const payload = asRecord(getResponseData(response));
      const items = toArray<unknown>(payload.items).map((item) => {
        const record = asRecord(item);
        return {
          id: asString(record.id),
          category: asString(record.category, 'pending_moderation') as AdminNotificationCategory,
          severity: asString(record.severity, 'info') as AdminNotificationFeedItem['severity'],
          title: asString(record.title, 'Notification'),
          message: asString(record.message),
          href: asString(record.href, '/admin'),
          count: 'count' in record ? asNumber(record.count, 0) : undefined,
          createdAt: asString(record.createdAt, new Date().toISOString()),
          metadata: asRecord(record.metadata) as Record<string, JsonValue>,
        };
      });

      return {
        items,
        total: asNumber(payload.total, items.length),
        generatedAt: asString(payload.generatedAt, new Date().toISOString()),
      };
    },
  },

  // ==================== USER MANAGEMENT ====================
  users: {
    getUsers: async (filters: UserFilters) => {
      const response = await apiClient.get('/admin/users', filters);
      const payload = getResponseData(response);
      const users = extractListCandidate<AdminUserSummary>(payload, ['data', 'users', 'items']);
      return toPaginatedResult(response, users, filters, ['users'], undefined, true);
    },

    createUser: (data: CreateAdminUserDto) =>
      apiClient.post<AdminUserSummary>('/admin/users', data),

    updateUser: (userId: string, data: UpdateAdminUserDto) =>
      apiClient.put<AdminUserSummary>(`/admin/users/${userId}`, data),

    deleteUser: (userId: string) =>
      apiClient.delete<{ success?: boolean; message?: string }>(`/admin/users/${userId}`),

    getUserDetails: (userId: string) =>
      apiClient.get<UserDetails>(`/admin/users/${userId}`),

    suspendUser: (userId: string, data: SuspendUserDto) =>
      apiClient.put<{ success?: boolean; message?: string }>(`/admin/users/${userId}/suspend`, data),

    activateUser: (userId: string, data: ActivateUserDto) =>
      apiClient.put<{ success?: boolean; message?: string }>(`/admin/users/${userId}/activate`, data),

    resetPassword: (userId: string, data: ResetUserPasswordDto) =>
      apiClient.post<{ success?: boolean; message?: string }>(`/admin/users/${userId}/reset-password`, data),

    updateNotes: (userId: string, notes: string) =>
      apiClient.put<{ success?: boolean; message?: string }>(`/admin/users/${userId}/notes`, { notes }),

    getAnalytics: (period?: string) =>
      apiClient.get<JsonObject>('/admin/users/analytics/overview', { period }),

    getGrowthMetrics: (period?: string) =>
      apiClient.get<JsonObject>('/admin/users/analytics/growth', { period }),

    getRetentionAnalysis: () =>
      apiClient.get<JsonObject>('/admin/users/analytics/retention'),

    getLifetimeValue: () =>
      apiClient.get<JsonObject>('/admin/users/analytics/lifetime-value'),
  },

  // ==================== COMMUNITY MANAGEMENT ====================
  communities: {
    getCommunities: async (filters: CommunityFilters) => {
      const normalizedFilters = {
        ...filters,
        status:
          filters.status === 'pending'
            ? 'pending_approval'
            : filters.status,
      };
      const response = await apiClient.get('/admin/communities', normalizedFilters);
      const payload = getResponseData(response);
      const communities = extractListCandidate<AdminCommunitySummary>(payload, ['data', 'communities', 'items']);
      return toPaginatedResult(response, communities, normalizedFilters, ['communities']);
    },

    getCommunityDetails: (communityId: string) =>
      apiClient.get(`/admin/communities/${communityId}`),

    getPendingApprovals: async (filters: CommunityFilters) => {
      const response = await apiClient.get('/admin/communities/pending-approvals', filters);
      const payload = getResponseData(response);
      const communities = extractListCandidate<AdminCommunitySummary>(payload, ['data', 'communities', 'items']);
      return toPaginatedResult(response, communities, filters, ['communities']);
    },

    approveCommunity: (communityId: string, data: ApproveCommunityDto) =>
      apiClient.put(`/admin/communities/${communityId}/approve`, data),

    rejectCommunity: (communityId: string, data: RejectCommunityDto) =>
      apiClient.put(`/admin/communities/${communityId}/reject`, data),

    bulkApproval: (data: BulkCommunityApprovalDto) =>
      apiClient.post('/admin/communities/bulk-approval', data),

    moderateCommunity: (communityId: string, data: CommunityModerationDto) =>
      apiClient.put(`/admin/communities/${communityId}/moderate`, data),

    getAnalytics: (communityId?: string, period?: string) =>
      apiClient.get('/admin/communities/analytics', { communityId, period }),

    getDetailedAnalytics: (communityId: string, period?: string, startDate?: string, endDate?: string) =>
      apiClient.get(`/admin/communities/${communityId}/detailed-analytics`, { period, startDate, endDate }),

    getAnalyticsSummary: (filters: AdminListQuery) =>
      apiClient.get<JsonObject>('/admin/communities/analytics/summary', filters),

    compareCommunities: (communityA: string, communityB: string, period?: string) =>
      apiClient.get('/admin/communities/analytics/compare', { communityA, communityB, period }),
  },

  // ==================== CONTENT MODERATION ====================
  contentModeration: {
    getQueue: async (filters: ContentModerationFilters) => {
      const response = await apiClient.get('/admin/content-moderation/queue', filters);
      const payload = getResponseData(response);
      const items = extractListCandidate<AdminModerationItem>(payload, ['data', 'items', 'queue']);
      return toPaginatedResult(response, items, filters, ['queue'], undefined, true);
    },

    getQueueStats: () =>
      apiClient.get('/admin/content-moderation/queue/stats'),

    getAnalytics: (filters: AdminListQuery) =>
      apiClient.get<JsonObject>('/admin/content-moderation/analytics', filters),

    getContentDetails: (itemId: string) =>
      apiClient.get(`/admin/content-moderation/queue/${itemId}`),

    moderateContent: (itemId: string, data: ModerateContentDto) =>
      apiClient.post(`/admin/content-moderation/queue/${itemId}/moderate`, data),

    bulkModerate: (data: BulkModerateContentDto) =>
      apiClient.post('/admin/content-moderation/queue/bulk-moderate', data),

    updatePriority: (itemId: string, priority: string) =>
      apiClient.put(`/admin/content-moderation/queue/${itemId}/priority`, { priority }),

    assignContent: (itemId: string, assignedTo: string) =>
      apiClient.post(`/admin/content-moderation/queue/${itemId}/assign`, { assignedTo }),
  },

  // ==================== FINANCIAL MANAGEMENT ====================
  financial: {
    getRevenueDashboard: async (query: RevenueDashboardQuery) => {
      const response = await apiClient.get('/admin/financial/revenue-dashboard', query);
      const payload = asRecord(getResponseData(response));
      return {
        ...response,
        data: {
          ...payload,
          totalRevenue: asNumber(payload.totalRevenue, 0),
          monthlyRevenue: asNumber(payload.subscriptionRevenue, asNumber(payload.monthlyRevenue, 0)),
          revenueGrowth: asNumber(payload.growthRate, asNumber(payload.revenueGrowth, 0)),
          totalTransactions: asNumber(payload.transactionCount, asNumber(payload.totalTransactions, 0)),
          activeSubscriptions: asNumber(payload.activeSubscriptions, 0),
          averageTransactionValue: asNumber(payload.averageTransactionValue, 0),
        },
      };
    },

    getSubscriptions: async (filters: SubscriptionFilters) => {
      const response = await apiClient.get('/admin/financial/subscriptions', filters);
      const payload = getResponseData(response);
      const subscriptions = extractListCandidate<UnknownRecord>(payload, ['data', 'subscriptions', 'items']).map((subscription) => {
        const creator = asRecord(subscription.creator ?? subscription.creatorId);
        const subscriber = asRecord(subscription.user ?? subscription.subscriber ?? subscription.subscriberId);

        return {
          ...subscription,
          user: Object.keys(subscriber).length
            ? {
                _id: asString(subscriber._id),
                username: asString(subscriber.username, asString(subscriber.name, asString(subscriber.email, 'Unknown user'))),
                email: asString(subscriber.email),
              }
            : null,
          creator: Object.keys(creator).length
            ? {
                _id: asString(creator._id),
                username: asString(creator.username, asString(creator.name, asString(creator.email, 'Unknown creator'))),
                email: asString(creator.email),
              }
            : null,
          community: subscription.community ?? null,
          planTier: asString(subscription.planTier, asString(subscription.plan)),
          nextBillingDate: asString(subscription.nextBillingDate, asString(subscription.nextBillingAt)) || null,
          startDate: asString(subscription.startDate, asString(subscription.currentPeriodStart, asString(subscription.createdAt))),
          endDate: asString(subscription.endDate, asString(subscription.currentPeriodEnd)) || null,
        };
      });
      return toPaginatedResult(response, subscriptions, filters, ['subscriptions']);
    },

    getTransactions: async (filters: TransactionFilters) => {
      const response = await apiClient.get('/admin/financial/transactions', filters);
      const payload = getResponseData(response);
      const rawTransactions = extractListCandidate<UnknownRecord>(payload, ['data', 'transactions', 'items']);
      const transactions = rawTransactions.map((tx) => ({
        ...tx,
        user: tx.user ?? tx.userId ?? null,
      }));
      return toPaginatedResult(response, transactions, filters, ['transactions']);
    },

    calculatePayout: (data: CalculatePayoutDto) =>
      apiClient.post('/admin/financial/payouts/calculate', data),

    initiatePayout: (data: InitiatePayoutDto) =>
      apiClient.post('/admin/financial/payouts/initiate', data),

    getPayouts: async (filters: PayoutFilters) => {
      const response = await apiClient.get('/admin/financial/payouts', filters);
      const payload = getResponseData(response);
      const payouts = extractListCandidate<UnknownRecord>(payload, ['data', 'payouts', 'items']).map((payout) => ({
        ...payout,
        creator: payout.creator || (payout.creatorId ? {
          _id: asString(asRecord(payout.creatorId)._id),
          username: asString(asRecord(payout.creatorId).username, asString(asRecord(payout.creatorId).name, asString(asRecord(payout.creatorId).email, 'Unknown creator'))),
          email: asString(asRecord(payout.creatorId).email),
        } : null),
        community: payout.community ?? payout.communityId ?? null,
        initiatedAt: asString(payout.initiatedAt, asString(payout.requestedAt, asString(payout.createdAt))),
      }));
      return toPaginatedResult(response, payouts, filters, ['payouts']);
    },

    getPayoutSummary: (startDate?: string, endDate?: string) =>
      apiClient.get('/admin/financial/payouts/summary', { startDate, endDate }),

    getPayoutById: (id: string) =>
      apiClient.get<AdminPayoutDetails>(`/admin/financial/payouts/${id}`),

    processPayout: (id: string, data: ProcessPayoutDto) =>
      apiClient.post(`/admin/financial/payouts/${id}/process`, data),

    bulkProcessPayouts: (payoutIds: string[], notes?: string) =>
      apiClient.post('/admin/financial/payouts/bulk-process', { payoutIds, notes }),

    updatePayoutStatus: (id: string, data: UpdatePayoutStatusDto) =>
      apiClient.patch(`/admin/financial/payouts/${id}/status`, data),

    cancelPayout: (id: string, reason: string) =>
      apiClient.post(`/admin/financial/payouts/${id}/cancel`, { reason }),

    generateReport: (data: { period: string; format?: string; startDate?: string; endDate?: string }) =>
      apiClient.post('/admin/financial/reports/generate', data),

    // Financial Analytics
    getRevenueByContentType: async (query: FinancialAnalyticsQuery) => {
      const response = await apiClient.get('/admin/financial/analytics/revenue-by-content-type', query);
      const payload = getResponseData(response) || {};
      const entries = Object.entries(payload) as Array<[string, number]>;
      const totalRevenue = entries.reduce((sum, [, value]) => sum + (Number(value) || 0), 0);
      const normalized = entries.map(([contentType, revenue]) => ({
        contentType,
        revenue: Number(revenue) || 0,
        percentage: totalRevenue > 0 ? ((Number(revenue) || 0) / totalRevenue) * 100 : 0,
      }));
      return {
        ...response,
        data: normalized,
      };
    },

    getTopCreators: async (query: FinancialAnalyticsQuery, limit?: number) => {
      const response = await apiClient.get('/admin/financial/analytics/top-creators', { ...query, limit });
      const payload = toArray(getResponseData(response));
      const normalized = payload.map((creator) => {
        const row = asRecord(creator);
        return {
          _id: asString(row.creatorId),
          username: asString(row.creatorName),
          totalRevenue: asNumber(row.totalRevenue, 0),
          totalSales: asNumber(row.transactionCount, 0),
        };
      });
      return {
        ...response,
        data: normalized,
      };
    },

    getRevenueGrowth: async (query: FinancialAnalyticsQuery) => {
      const response = await apiClient.get('/admin/financial/analytics/revenue-growth', query);
      const payload = asRecord(getResponseData(response));
      
      // Map to a format suitable for the LineChart component
      // It expects an array of objects where each object is a data point
      const data = [
        {
          period: 'Previous',
          revenue: asNumber(payload.previousPeriodRevenue, 0),
          growth: 0,
        },
        {
          period: 'Current',
          revenue: asNumber(payload.currentPeriodRevenue, 0),
          growth: asNumber(payload.growthRate, 0),
        },
      ];

      return {
        ...response,
        data,
      };
    },

    getPayoutAnalytics: (query: FinancialAnalyticsQuery) =>
      apiClient.get('/admin/financial/analytics/payout-analytics', query),

    getTransactionAnalytics: (query: FinancialAnalyticsQuery) =>
      apiClient.get('/admin/financial/analytics/transaction-analytics', query),

    getPlatformFeesAnalytics: (query: FinancialAnalyticsQuery) =>
      apiClient.get('/admin/financial/analytics/platform-fees', query),

    getFinancialHealth: (query: FinancialAnalyticsQuery) =>
      apiClient.get('/admin/financial/analytics/financial-health', query),
  },

  // ==================== ANALYTICS DASHBOARD ====================
  analytics: {
    getDashboard: (period: AnalyticsPeriodDto) =>
      apiClient.get('/admin/analytics-dashboard', period),

    getPlatformStatistics: (period: AnalyticsPeriodDto) =>
      apiClient.get('/admin/analytics-dashboard/statistics', period),

    getEngagementMetrics: (period: AnalyticsPeriodDto) =>
      apiClient.get('/admin/analytics-dashboard/engagement', period),

    getRetentionAnalysis: (period: AnalyticsPeriodDto) =>
      apiClient.get('/admin/analytics-dashboard/retention', period),

    exportAnalytics: (data: JsonObject) =>
      apiClient.post<JsonObject>('/admin/analytics-dashboard/export', data),

    // Alerts
    createAlert: (data: {
      name: string;
      description: string;
      metricType: AdminAlertMetricType;
      condition: 'greater_than' | 'less_than' | 'equals' | 'change_percentage';
      threshold: number;
      severity: 'info' | 'warning' | 'critical';
      notifyAdmins?: string[];
      notifyEmails?: string[];
    }) =>
      apiClient.post<AdminAlertConfig>('/admin/analytics-dashboard/alerts', data),

    getAlerts: () =>
      apiClient.get<AdminAlertConfig[]>('/admin/analytics-dashboard/alerts'),

    getAlertById: (id: string) =>
      apiClient.get<AdminAlertConfig>(`/admin/analytics-dashboard/alerts/${id}`),

    updateAlert: (id: string, data: {
      name?: string;
      description?: string;
      threshold?: number;
      severity?: 'info' | 'warning' | 'critical';
      notifyAdmins?: string[];
      notifyEmails?: string[];
      isEnabled?: boolean;
    }) =>
      apiClient.put<AdminAlertConfig>(`/admin/analytics-dashboard/alerts/${id}`, data),

    deleteAlert: (id: string) =>
      apiClient.delete(`/admin/analytics-dashboard/alerts/${id}`),

    checkAlerts: () =>
      apiClient.post('/admin/analytics-dashboard/alerts/check'),

    getAdminAnalyticsDashboard: (period: AnalyticsPeriodDto = {}) =>
      apiClient.get<JsonObject>('/admin/analytics/dashboard', period),

    getAdminUserGrowth: (period: AnalyticsPeriodDto = {}) =>
      apiClient.get<JsonObject>('/admin/analytics/user-growth', period),

    getAdminEngagement: (period: AnalyticsPeriodDto = {}) =>
      apiClient.get<JsonObject>('/admin/analytics/engagement', period),

    getAdminRevenue: (period: AnalyticsPeriodDto = {}) =>
      apiClient.get<JsonObject>('/admin/analytics/revenue', period),

    getAdminHealth: (period: AnalyticsPeriodDto = {}) =>
      apiClient.get<JsonObject>('/admin/analytics/health', period),

    getAdminComparative: (period: AnalyticsPeriodDto = {}) =>
      apiClient.get<JsonObject>('/admin/analytics/comparative', period),

    generateAdminReport: (payload: AdminAnalyticsReportRequest = {}) =>
      apiClient.post<JsonObject>('/admin/analytics/report', payload),
  },

  // ==================== SECURITY AUDIT ====================
  security: {
    getAuditLogs: async (filters: AuditLogFilters) => {
      const response = await apiClient.get('/admin/security/audit-trail', filters);
      const payload = getResponseData(response);
      const logs = extractListCandidate<unknown>(payload, ['data', 'items', 'logs']).map(normalizeAuditLog);
      return toPaginatedResult(response, logs, filters, ['logs']);
    },

    getAuditLogById: async (id: string) => {
      const response = await adminApi.security.getAuditLogs({ page: 1, limit: 500 });
      const records = toArray<AdminAuditLog>(asRecord(getResponseData(response)).items);
      const record = records.find((entry) => entry._id === id) || null;
      return {
        ...response,
        data: record,
      };
    },

    getSecurityEvents: async (filters: SecurityEventFilters = {}) => {
      const response = await apiClient.get('/admin/security/alerts', {
        severity: filters.severity,
        type: filters.eventType,
        resolved: filters.resolved,
      });
      const payload = getResponseData(response);
      const normalized = extractListCandidate<unknown>(payload, ['data', 'alerts', 'items']).map(normalizeSecurityEvent);
      const totalFromResponse = asNumber(asRecord(getResponseRoot(response)).total, normalized.length);
      return toPaginatedResult(response, normalized, filters, ['alerts'], totalFromResponse);
    },

    getSecurityEventById: async (id: string) => {
      const response = await adminApi.security.getSecurityEvents({ page: 1, limit: 500 });
      const records = toArray<AdminSecurityEvent>(asRecord(getResponseData(response)).items);
      const record = records.find((entry) => entry._id === id) || null;
      return {
        ...response,
        data: record,
      };
    },

    resolveSecurityEvent: (id: string, resolution: string) =>
      apiClient.put(`/admin/security/alerts/${id}/resolve`, { notes: resolution }),

    getSecurityMetrics: async () => {
      const response = await apiClient.get('/admin/security/statistics');
      const payload = getResponseData(response);
      return {
        ...response,
        data: normalizeSecurityMetrics(payload),
      };
    },

    getSecurityConfig: async () => {
      const response = await apiClient.get('/admin/security/config');
      const payload = getResponseData(response);
      return {
        ...response,
        data: normalizeSecurityConfig(payload),
      };
    },

    updateSecurityConfig: async (data: AdminSecurityConfig) => {
      const response = await apiClient.put('/admin/security/config', data);
      const payload = getResponseData(response);
      return {
        ...response,
        data: normalizeSecurityConfig(payload),
      };
    },

    getNotificationStatistics: async () => {
      const response = await apiClient.get('/admin/security/notifications/statistics');
      const payload = getResponseData(response);
      return {
        ...response,
        data: normalizeNotificationStats(payload),
      };
    },

    sendTestAlert: () =>
      apiClient.post('/admin/security/alerts/test'),

    getAuditReport: async (params?: { startDate?: string; endDate?: string }) => {
      const response = await apiClient.get('/admin/security/audit/report', params);
      const payload = getResponseData(response);
      return {
        ...response,
        data: normalizeAuditReport(payload),
      };
    },

    getComplianceReport: async () => {
      const response = await apiClient.get('/admin/security/compliance/report');
      const payload = getResponseData(response);
      return {
        ...response,
        data: normalizeComplianceReport(payload),
      };
    },

    getIncidentReport: async (incidentId: string) => {
      const response = await apiClient.get(`/admin/security/incidents/${incidentId}/report`);
      const payload = getResponseData(response);
      return {
        ...response,
        data: normalizeIncidentReport(payload),
      };
    },

    exportAuditLogs: async (
      filters: AuditLogFilters,
      format: 'csv' | 'json' | 'pdf' = 'csv',
    ) => {
      const response = await apiClient.post('/admin/security/audit-trail/export', {
        format: format === 'pdf' ? 'csv' : format,
        filters,
      });
      const payload = getResponseData(response);
      return {
        ...response,
        data: {
          content: asString(asRecord(payload).content, asString(payload)),
        },
      };
    },

    searchAuditLogs: async (filters: AuditLogFilters) => {
      const response = await apiClient.post('/admin/security/audit-trail/search', {
        adminUserId: filters.adminUserId,
        action: filters.action,
        entityType: filters.entityType,
        entityId: filters.entityId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status,
        ipAddress: filters.ipAddress,
        searchTerm: filters.searchTerm,
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      const payload = getResponseData(response);
      const logs = extractListCandidate<unknown>(payload, ['data', 'items', 'logs']).map(normalizeAuditLog);
      return toPaginatedResult(response, logs, filters, ['logs']);
    },

    exportAuditLogsCustom: async (data: {
      format?: 'csv' | 'json' | 'excel';
      fields?: string[];
      adminUserId?: string;
      action?: string;
      entityType?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const response = await apiClient.post('/admin/security/audit-trail/export/custom', data);
      const payload = getResponseData(response);
      return {
        ...response,
        data: {
          content: typeof payload === 'string' ? payload : asString(asRecord(payload).content, ''),
        },
      };
    },
  },

  // ==================== COMMUNICATION MANAGEMENT ====================
  communication: {
    createEmailCampaign: async (data: CreateEmailCampaignDto | LegacyCreateEmailCampaignDto) => {
      const payload = toCanonicalCampaignPayload(data);
      const response = await apiClient.post('/admin/communication/campaigns', payload);
      return {
        ...response,
        data: normalizeCampaign(getResponseData(response)),
      };
    },

    getEmailCampaigns: async (filters: AdminListQuery = {}) => {
      const response = await apiClient.get('/admin/communication/campaigns', filters);
      const payload = getResponseData(response);
      const campaigns = extractListCandidate<UnknownRecord>(payload, ['data', 'campaigns', 'items'])
        .map(normalizeCampaign)
        .filter((entry): entry is AdminCampaign => Boolean(entry));
      return toPaginatedResult(response, campaigns, filters, ['campaigns']);
    },

    getEmailCampaignById: async (id: string) => {
      const response = await apiClient.get(`/admin/communication/campaigns/${id}`);
      const campaign = normalizeCampaign(getResponseData(response));
      return {
        ...response,
        data: {
          campaign,
        },
      };
    },

    updateEmailCampaign: async (
      id: string,
      data: Partial<CreateEmailCampaignDto | LegacyCreateEmailCampaignDto>,
    ) => {
      const payload = toCanonicalCampaignPatchPayload(data);
      const response = await apiClient.put(`/admin/communication/campaigns/${id}`, payload);
      return {
        ...response,
        data: normalizeCampaign(getResponseData(response)),
      };
    },

    deleteEmailCampaign: (id: string) =>
      apiClient.delete(`/admin/communication/campaigns/${id}`),

    sendEmailCampaign: async (id: string) => {
      const response = await apiClient.post(`/admin/communication/campaigns/${id}/send`);
      return {
        ...response,
        data: normalizeCampaign(getResponseData(response)),
      };
    },

    sendBulkMessage: (data: BulkMessageDto) =>
      apiClient.post('/admin/communication/bulk-message', toCanonicalBulkMessagePayload(data)),

    getEmailTemplates: async () => {
      const response = await apiClient.get('/admin/communication/templates');
      const payload = getResponseData(response);
      const templates = extractListCandidate<UnknownRecord>(payload, ['data', 'templates', 'items']).map(normalizeTemplate);
      return {
        ...response,
        data: {
          templates,
        },
      };
    },

    getEmailTemplateById: async (id: string) => {
      const response = await apiClient.get(`/admin/communication/templates/${id}`);
      return {
        ...response,
        data: normalizeTemplate(asRecord(getResponseData(response))),
      };
    },

    createEmailTemplate: (data: Partial<CreateEmailTemplateDto>) =>
      apiClient.post('/admin/communication/templates', toCanonicalTemplatePayload(data)),

    updateEmailTemplate: (id: string, data: Partial<CreateEmailTemplateDto>) =>
      apiClient.put(`/admin/communication/templates/${id}`, toCanonicalTemplatePatchPayload(data)),

    deleteEmailTemplate: (id: string) =>
      apiClient.delete(`/admin/communication/templates/${id}`),

    getTemplateVersionHistory: async (id: string) => {
      const response = await apiClient.get(`/admin/communication/templates/${id}/versions`);
      const payload = getResponseData(response);
      const versions = extractListCandidate(payload, ['versions', 'data', 'items']).map(normalizeTemplateVersion);
      return {
        ...response,
        data: { versions },
      };
    },

    restoreTemplateVersion: async (id: string, version: number) => {
      const response = await apiClient.post(`/admin/communication/templates/${id}/restore/${version}`);
      return {
        ...response,
        data: normalizeTemplate(asRecord(getResponseData(response))),
      };
    },

    previewTemplate: async (id: string, testData?: Record<string, unknown>) => {
      const response = await apiClient.post(`/admin/communication/templates/${id}/preview`, testData ?? {});
      const payload = asRecord(getResponseData(response));
      return {
        ...response,
        data: {
          subject: asString(payload.subject),
          content: asString(payload.content),
          variables: toArray<string>(payload.variables),
        } as AdminTemplatePreview,
      };
    },

    sendTestEmail: (id: string, payload: { testEmail: string; testData?: Record<string, unknown> }) =>
      apiClient.post(`/admin/communication/templates/${id}/test`, payload),

    duplicateTemplate: async (id: string, newName: string) => {
      const response = await apiClient.post(`/admin/communication/templates/${id}/duplicate`, { newName });
      return {
        ...response,
        data: normalizeTemplate(asRecord(getResponseData(response))),
      };
    },

    getNotificationConfigs: async () => {
      const response = await apiClient.get('/admin/communication/notifications/config');
      const payload = getResponseData(response);
      const configs = extractListCandidate(payload, ['data', 'configs', 'items']).map(normalizeNotificationConfig);
      return {
        ...response,
        data: { configs },
      };
    },

    getNotificationConfigById: async (id: string) => {
      const response = await apiClient.get(`/admin/communication/notifications/config/${id}`);
      return {
        ...response,
        data: normalizeNotificationConfig(getResponseData(response)),
      };
    },

    createNotificationConfig: (payload: Record<string, unknown>) =>
      apiClient.post('/admin/communication/notifications/config', payload),

    updateNotificationConfig: (id: string, payload: Record<string, unknown>) =>
      apiClient.put(`/admin/communication/notifications/config/${id}`, payload),

    deleteNotificationConfig: (id: string) =>
      apiClient.delete(`/admin/communication/notifications/config/${id}`),

    getNotificationDeliveryStats: async (filters: AdminListQuery = {}) => {
      const response = await apiClient.get('/admin/communication/notifications/analytics/delivery-stats', filters);
      const payload = asRecord(getResponseData(response));
      const byType = toArray<unknown>(payload.byType).map((entry) => {
        const item = asRecord(entry);
        return {
          type: asString(item.type),
          sent: asNumber(item.sent),
          delivered: asNumber(item.delivered),
          read: asNumber(item.read),
          deliveryRate: asNumber(item.deliveryRate),
          readRate: asNumber(item.readRate),
        };
      });

      return {
        ...response,
        data: {
          totalSent: asNumber(payload.totalSent),
          totalDelivered: asNumber(payload.totalDelivered),
          totalRead: asNumber(payload.totalRead),
          deliveryRate: asNumber(payload.deliveryRate),
          readRate: asNumber(payload.readRate),
          byType,
        } as AdminNotificationDeliveryStats,
      };
    },

    getCampaignAnalytics: async (filters: AdminListQuery) => {
      const [metrics, campaignPerformance, deliveryStatus, engagement] = await Promise.all([
        apiClient.get('/admin/communication/analytics/metrics', filters),
        apiClient.get('/admin/communication/analytics/campaign-performance', filters),
        apiClient.get('/admin/communication/analytics/delivery-status', filters),
        apiClient.get('/admin/communication/analytics/engagement', filters),
      ]);

      return {
        data: {
          metrics: getResponseData(metrics),
          campaignPerformance: getResponseData(campaignPerformance),
          deliveryStatus: getResponseData(deliveryStatus),
          engagement: getResponseData(engagement),
        },
      };
    },
  },

  exports: {
    createJob: async (payload: CreateAdminExportJobDto) => {
      const response = await apiClient.post('/admin/export/jobs', payload);
      return {
        ...response,
        data: normalizeExportJob(getResponseData(response)),
      };
    },

    getJobStatus: async (jobId: string) => {
      const response = await apiClient.get(`/admin/export/jobs/${jobId}`);
      return {
        ...response,
        data: normalizeExportJob(getResponseData(response)),
      };
    },

    getJobs: async (limit?: number) => {
      const response = await apiClient.get('/admin/export/jobs', limit ? { limit } : undefined);
      const payload = asRecord(getResponseData(response));
      return {
        ...response,
        data: {
          jobs: toArray<unknown>(payload.jobs).map(normalizeExportJob),
          total: asNumber(payload.total, 0),
        } as AdminExportJobList,
      };
    },

    cleanupExpiredJobs: () =>
      apiClient.post<{ message?: string; cleanedCount?: number }>('/admin/export/cleanup'),
  },

  dataManagement: {
    getActiveOperations: async () => {
      const response = await apiClient.get('/admin/data-management/bulk-operations/active');
      return {
        ...response,
        data: toArray<unknown>(getResponseData(response)).map(normalizeBulkOperationProgress),
      };
    },

    getOperationProgress: async (operationId: string) => {
      const response = await apiClient.get(`/admin/data-management/bulk-operations/${operationId}/progress`);
      return {
        ...response,
        data: normalizeBulkOperationProgress(getResponseData(response)),
      };
    },

    cancelOperation: (operationId: string) =>
      apiClient.post<{ message: string }>(`/admin/data-management/bulk-operations/${operationId}/cancel`),

    validate: async (payload: { data: Record<string, unknown>; constraints: Record<string, unknown> }) => {
      const response = await apiClient.post('/admin/data-management/validate', payload);
      return {
        ...response,
        data: normalizeValidationResult(getResponseData(response)),
      };
    },
  },

  content: {
    // Summary
    getSummary: () => apiClient.get('/admin/content/summary'),

    // Courses
    getCourses: (filters: Record<string, unknown> = {}) =>
      apiClient.get('/admin/content/courses', filters),
    getCourseById: (id: string) =>
      apiClient.get(`/admin/content/courses/${id}`),
    approveCourse: (id: string) =>
      apiClient.put(`/admin/content/courses/${id}/approve`, {}),
    rejectCourse: (id: string, reason: string) =>
      apiClient.put(`/admin/content/courses/${id}/reject`, { reason }),
    featureCourse: (id: string, featured: boolean) =>
      apiClient.put(`/admin/content/courses/${id}/feature`, { featured }),
    getCourseEnrollments: (id: string, pagination: Record<string, unknown> = {}) =>
      apiClient.get(`/admin/content/courses/${id}/enrollments`, pagination),
    bulkApproveCourses: (ids: string[]) =>
      apiClient.post('/admin/content/courses/bulk-approve', { ids }),

    // Challenges
    getChallenges: (filters: Record<string, unknown> = {}) =>
      apiClient.get('/admin/content/challenges', filters),
    getChallengeById: (id: string) =>
      apiClient.get(`/admin/content/challenges/${id}`),
    getChallengeSubmissions: (id: string, filters: Record<string, unknown> = {}) =>
      apiClient.get(`/admin/content/challenges/${id}/submissions`, filters),
    approveChallenge: (id: string) =>
      apiClient.put(`/admin/content/challenges/${id}/approve`, {}),
    rejectChallenge: (id: string, reason: string) =>
      apiClient.put(`/admin/content/challenges/${id}/reject`, { reason }),
    endChallengeEarly: (id: string) =>
      apiClient.put(`/admin/content/challenges/${id}/end`, {}),
    approveSubmission: (submissionId: string, feedback?: string, markAsWinner?: boolean) =>
      apiClient.put(`/admin/content/challenges/submissions/${submissionId}/approve`, { feedback, markAsWinner }),
    rejectSubmission: (submissionId: string, reason: string, feedback?: string) =>
      apiClient.put(`/admin/content/challenges/submissions/${submissionId}/reject`, { reason, feedback }),

    // Events
    getEvents: (filters: Record<string, unknown> = {}) =>
      apiClient.get('/admin/content/events', filters),
    getEventById: (id: string) =>
      apiClient.get(`/admin/content/events/${id}`),
    getEventAttendees: (id: string, pagination: Record<string, unknown> = {}) =>
      apiClient.get(`/admin/content/events/${id}/attendees`, pagination),
    approveEvent: (id: string) =>
      apiClient.put(`/admin/content/events/${id}/approve`, {}),
    rejectEvent: (id: string, reason: string) =>
      apiClient.put(`/admin/content/events/${id}/reject`, { reason }),
    cancelEvent: (id: string, reason: string) =>
      apiClient.put(`/admin/content/events/${id}/cancel`, { reason }),
    messageAttendees: (id: string, message: string, sendEmail?: boolean) =>
      apiClient.post(`/admin/content/events/${id}/message-attendees`, { message, sendEmail }),

    // Posts
    getPosts: (filters: Record<string, unknown> = {}) =>
      apiClient.get('/admin/content/posts', filters),
    getPostById: (id: string) =>
      apiClient.get(`/admin/content/posts/${id}`),
    moderatePost: (id: string, action: 'hide' | 'delete' | 'restore') =>
      apiClient.put(`/admin/content/posts/${id}/moderate`, { action }),
    featurePost: (id: string, featured: boolean) =>
      apiClient.put(`/admin/content/posts/${id}/feature`, { featured }),
    deletePost: (id: string) =>
      apiClient.delete(`/admin/content/posts/${id}`),
    deleteComment: (postId: string, commentId: string) =>
      apiClient.delete(`/admin/content/posts/${postId}/comments/${commentId}`),
  },

  support: {
    listTickets: (filters: LiveSupportAdminFilters = {}) =>
      apiClient.get('/live-support/admin/tickets', filters),

    getMessages: (ticketId: string, params?: { cursor?: string; limit?: number }) =>
      apiClient.get(`/live-support/admin/tickets/${ticketId}/messages`, params),

    claimTicket: (ticketId: string) =>
      apiClient.post(`/live-support/admin/tickets/${ticketId}/claim`),

    sendMessage: (ticketId: string, text: string) =>
      apiClient.post(`/live-support/admin/tickets/${ticketId}/message`, { text }),

    closeTicket: (ticketId: string) =>
      apiClient.post(`/live-support/admin/tickets/${ticketId}/close`),

    getQueueCounts: () =>
      apiClient.get('/live-support/admin/queue-counts'),
  },
};

export default adminApi;
