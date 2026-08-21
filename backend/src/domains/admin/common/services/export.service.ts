import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog } from '@/domains/admin/schemas/audit-log.schema';
import { User } from '@/infrastructure/database/schemas/auth/user.schema';
import { Community } from '@/infrastructure/database/schemas/community/community.schema';
import { Order } from '@/infrastructure/database/schemas/commerce/order.schema';
import { Subscription } from '@/infrastructure/database/schemas/commerce/subscription.schema';
import { WalletTransaction } from '@/infrastructure/database/schemas/commerce/wallet-transaction.schema';
import { Payout } from '@/infrastructure/database/schemas/commerce/payout.schema';
import { Cours } from '@/infrastructure/database/schemas/learning/course.schema';
import { Post } from '@/infrastructure/database/schemas/content/post.schema';
import { Event } from '@/infrastructure/database/schemas/commerce/event.schema';
import { Product } from '@/infrastructure/database/schemas/commerce/product.schema';

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
  JSON = 'json',
}

export enum ExportType {
  USERS = 'users',
  COMMUNITIES = 'communities',
  CONTENT = 'content',
  FINANCIAL = 'financial',
  AUDIT_LOGS = 'audit_logs',
  ANALYTICS = 'analytics',
}

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export interface ExportJob {
  id: string;
  type: ExportType;
  filters: Record<string, any>;
  fields?: string[];
  format: ExportFormat;
  status: ExportStatus;
  progress: number;
  downloadUrl?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  fileSize?: number;
  recordCount?: number;
}

export interface ExportConfig {
  type: ExportType;
  format: ExportFormat;
  filters?: Record<string, any>;
  fields?: string[];
  createdBy: Types.ObjectId;
}

/**
 * ExportService manages data export functionality across all admin domains
 * Handles background job processing for large dataset exports
 */
@Injectable()
export class ExportService {
  private exportJobs: Map<string, ExportJob> = new Map();
  private exportFiles: Map<string, Buffer> = new Map();

  constructor(
    @Optional() @InjectModel(User.name) private readonly userModel?: Model<any>,
    @Optional() @InjectModel(Community.name) private readonly communityModel?: Model<any>,
    @Optional() @InjectModel(Order.name) private readonly orderModel?: Model<any>,
    @Optional() @InjectModel(Subscription.name) private readonly subscriptionModel?: Model<any>,
    @Optional() @InjectModel(WalletTransaction.name) private readonly walletTransactionModel?: Model<any>,
    @Optional() @InjectModel(Payout.name) private readonly payoutModel?: Model<any>,
    @Optional() @InjectModel(Cours.name) private readonly courseModel?: Model<any>,
    @Optional() @InjectModel(Post.name) private readonly postModel?: Model<any>,
    @Optional() @InjectModel(Event.name) private readonly eventModel?: Model<any>,
    @Optional() @InjectModel(Product.name) private readonly productModel?: Model<any>,
    @Optional() @InjectModel(AuditLog.name) private readonly auditLogModel?: Model<any>,
  ) {}

  /**
   * Create a new export job
   * @param config - Export configuration
   */
  async createExportJob(config: ExportConfig): Promise<ExportJob> {
    const jobId = this.generateJobId();
    
    const job: ExportJob = {
      id: jobId,
      type: config.type,
      filters: config.filters || {},
      fields: config.fields?.filter(Boolean),
      format: config.format,
      status: ExportStatus.PENDING,
      progress: 0,
      createdBy: this.toObjectId(config.createdBy),
      createdAt: new Date(),
    };

    this.exportJobs.set(jobId, job);

    // Start processing in background
    this.processExportJob(jobId).catch(error => {
      console.error(`Export job ${jobId} failed:`, error);
      this.updateJobStatus(jobId, ExportStatus.FAILED, 0, error.message);
    });

    return job;
  }

  /**
   * Process an export job
   * @param jobId - Export job ID
   */
  async processExportJob(jobId: string): Promise<void> {
    const job = this.exportJobs.get(jobId);
    if (!job) {
      throw new Error(`Export job ${jobId} not found`);
    }

    try {
      // Update status to processing
      this.updateJobStatus(jobId, ExportStatus.PROCESSING, 10);

      // Keep processing observable for the UI, then fetch real rows.
      await this.simulateDataProcessing(jobId);

      const rows = await this.loadExportRows(job);
      job.recordCount = rows.length;
      this.updateJobStatus(jobId, ExportStatus.PROCESSING, 80);

      // Generate the actual export file content from fetched backend data.
      const exportData = this.generateExportData(job, rows);

      this.exportFiles.set(jobId, Buffer.from(exportData, 'utf8'));

      // Save file and generate download URL
      const downloadUrl = this.getDownloadUrl(jobId);
      
      // Complete the job
      const updatedJob = this.exportJobs.get(jobId);
      if (updatedJob) {
        updatedJob.status = ExportStatus.COMPLETED;
        updatedJob.progress = 100;
        updatedJob.downloadUrl = downloadUrl;
        updatedJob.completedAt = new Date();
        updatedJob.fileSize = Buffer.byteLength(exportData, 'utf8');
        updatedJob.recordCount = rows.length;
      }

    } catch (error) {
      this.updateJobStatus(jobId, ExportStatus.FAILED, 0, error.message);
      throw error;
    }
  }

  /**
   * Get export job status
   * @param jobId - Export job ID
   */
  async getExportStatus(jobId: string): Promise<ExportJob | null> {
    return this.exportJobs.get(jobId) || null;
  }

  /**
   * Download export file
   * @param jobId - Export job ID
   */
  async downloadExport(jobId: string): Promise<Buffer> {
    const job = this.exportJobs.get(jobId);
    if (!job) {
      throw new Error(`Export job ${jobId} not found`);
    }

    if (job.status !== ExportStatus.COMPLETED) {
      throw new Error(`Export job ${jobId} is not completed`);
    }

    if (!job.downloadUrl) {
      throw new Error(`Download URL not available for job ${jobId}`);
    }

    const file = this.exportFiles.get(jobId);
    if (!file) {
      throw new Error(`Export file for job ${jobId} is not available`);
    }

    return file;
  }

  /**
   * Get all export jobs for a user
   * @param userId - User ID
   */
  async getUserExportJobs(userId: string): Promise<ExportJob[]> {
    const userJobs: ExportJob[] = [];
    
    for (const job of this.exportJobs.values()) {
      if (job.createdBy.toString() === userId) {
        userJobs.push(job);
      }
    }

    return userJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Clean up expired export jobs
   */
  async cleanupExpiredJobs(): Promise<number> {
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours
    const now = new Date();
    let cleanedCount = 0;

    for (const [jobId, job] of this.exportJobs.entries()) {
      const jobAge = now.getTime() - job.createdAt.getTime();
      
      if (jobAge > expirationTime) {
        // Mark as expired and remove from memory
        job.status = ExportStatus.EXPIRED;
        this.exportJobs.delete(jobId);
        this.exportFiles.delete(jobId);
        cleanedCount += 1;
      }
    }

    return cleanedCount;
  }

  private generateJobId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateJobStatus(
    jobId: string, 
    status: ExportStatus, 
    progress: number, 
    errorMessage?: string
  ): void {
    const job = this.exportJobs.get(jobId);
    if (job) {
      job.status = status;
      job.progress = progress;
      if (errorMessage) {
        job.errorMessage = errorMessage;
      }
    }
  }

  private async simulateDataProcessing(jobId: string): Promise<void> {
    const progressSteps = [20, 40, 60, 70];
    
    for (const progress of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 125));
      this.updateJobStatus(jobId, ExportStatus.PROCESSING, progress);
    }
  }

  private async loadExportRows(job: ExportJob): Promise<Record<string, any>[]> {
    switch (job.type) {
      case ExportType.USERS:
        return this.loadUsers(job.filters);
      case ExportType.COMMUNITIES:
        return this.loadCommunities(job.filters);
      case ExportType.CONTENT:
        return this.loadContent(job.filters);
      case ExportType.FINANCIAL:
        return this.loadFinancial(job.filters);
      case ExportType.AUDIT_LOGS:
        return this.loadAuditLogs(job.filters);
      case ExportType.ANALYTICS:
        return this.loadAnalytics(job.filters);
      default:
        return [];
    }
  }

  private generateExportData(job: ExportJob, rows: Record<string, any>[]): string {
    const data = this.applyFieldSelection(rows.map((row) => this.normalizeRow(row)), job.fields);
    const envelope = {
      exportType: job.type,
      format: job.format,
      filters: job.filters,
      fields: job.fields,
      generatedAt: new Date().toISOString(),
      recordCount: data.length,
      data,
    };

    switch (job.format) {
      case ExportFormat.JSON:
        return JSON.stringify(envelope, null, 2);
      
      case ExportFormat.CSV:
        return this.convertToCSV(data, job.fields);
      
      case ExportFormat.EXCEL:
        return this.convertToExcelHtml(data, job);
      
      case ExportFormat.PDF:
        return this.convertToPdfText(envelope);
      
      default:
        return JSON.stringify(envelope, null, 2);
    }
  }

  private async loadUsers(filters: Record<string, any>): Promise<Record<string, any>[]> {
    if (!this.userModel) return this.unavailableRows(ExportType.USERS);

    const query: Record<string, any> = {};
    const andConditions: Record<string, any>[] = [];
    const statuses = this.toStringArray(filters.status ?? filters.statuses);
    if (statuses.length) {
      andConditions.push({
        $or: statuses.map((status) => status === 'suspended'
          ? { isSuspended: true }
          : { isSuspended: { $ne: true }, accountStatus: status }),
      });
    }

    const roles = this.toStringArray(filters.role ?? filters.roles);
    if (roles.length) query.role = { $in: roles };

    if (filters.searchTerm || filters.search) {
      const regex = new RegExp(this.escapeRegExp(String(filters.searchTerm ?? filters.search)), 'i');
      andConditions.push({ $or: [{ name: regex }, { email: regex }, { username: regex }] });
    }

    this.assignDateRange(query, 'createdAt', filters, ['registrationDateRange', 'dateRange']);
    if (andConditions.length) query.$and = andConditions;

    const users = await this.userModel
      .find(query)
      .select('-password -googleTokens')
      .sort({ createdAt: -1 })
      .limit(this.getLimit(filters))
      .lean()
      .exec();

    return users.map((user: any) => ({
      id: this.stringifyId(user._id),
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.isSuspended ? 'suspended' : (user.accountStatus || 'active'),
      createdAt: user.createdAt,
      walletBalance: user.walletBalance,
      country: user.pays,
      city: user.ville,
    }));
  }

  private async loadCommunities(filters: Record<string, any>): Promise<Record<string, any>[]> {
    if (!this.communityModel) return this.unavailableRows(ExportType.COMMUNITIES);

    const query: Record<string, any> = {};
    const statuses = this.toStringArray(filters.status ?? filters.statuses);
    if (statuses.length) {
      const statusConditions: Record<string, any>[] = [];
      for (const status of statuses) {
        if (status === 'active') {
          statusConditions.push({ isActive: true });
        } else if (status === 'inactive') {
          statusConditions.push({ isActive: false });
        } else if (status === 'suspended') {
          statusConditions.push({ isSuspended: true });
        } else if (status === 'pending' || status === 'pending_approval') {
          statusConditions.push({ approvalStatus: 'pending' }, { approvalStatus: { $exists: false } }, { approvalStatus: null });
        } else {
          statusConditions.push({ approvalStatus: status }, { status });
        }
      }
      query.$or = statusConditions;
    }

    if (filters.category) query.category = { $regex: this.escapeRegExp(String(filters.category)), $options: 'i' };
    if (filters.creatorId && Types.ObjectId.isValid(String(filters.creatorId))) {
      query.createur = new Types.ObjectId(String(filters.creatorId));
    }
    this.assignDateRange(query, 'createdAt', filters, ['dateRange']);

    const communities = await this.communityModel
      .find(query)
      .populate('createur', 'name email username')
      .sort({ createdAt: -1 })
      .limit(this.getLimit(filters))
      .lean()
      .exec();

    return communities.map((community: any) => ({
      id: this.stringifyId(community._id),
      name: community.name,
      slug: community.slug,
      status: this.getCommunityStatus(community),
      creator: community.createur?.name || community.createur?.email || this.stringifyId(community.createur),
      creatorEmail: community.createur?.email,
      category: community.category,
      membersCount: community.membersCount ?? community.members?.length ?? 0,
      isActive: community.isActive,
      isVerified: community.isVerified,
      featured: community.featured,
      priceType: community.priceType,
      revenue: community.stats?.totalRevenue ?? 0,
      createdAt: community.createdAt,
    }));
  }

  private async loadContent(filters: Record<string, any>): Promise<Record<string, any>[]> {
    const types = this.toStringArray(filters.contentType ?? filters.contentTypes);
    const requested = types.length ? new Set(types.map((type) => type.toLowerCase())) : null;
    const rows: Record<string, any>[] = [];
    const dateQuery: Record<string, any> = {};
    this.assignDateRange(dateQuery, 'createdAt', filters, ['dateRange']);
    const statuses = this.toStringArray(filters.status ?? filters.statuses);
    if (statuses.length) {
      const statusFilter = statuses.length === 1 ? statuses[0] : { $in: statuses };
      dateQuery.$or = [
        { status: statusFilter },
        { validationStatus: statusFilter },
        { moderationStatus: statusFilter },
      ];
    }
    const limit = Math.max(1, Math.floor(this.getLimit(filters) / 4));

    if (!requested || requested.has('course') || requested.has('courses')) {
      rows.push(...await this.loadContentModel(this.courseModel, 'course', dateQuery, limit, (course) => ({
        title: course.titre || course.title,
        status: course.validationStatus || course.status,
        communityId: course.communityId,
        creatorId: course.creatorId,
        price: course.price,
      })));
    }
    if (!requested || requested.has('post') || requested.has('posts')) {
      rows.push(...await this.loadContentModel(this.postModel, 'post', dateQuery, limit, (post) => ({
        title: post.title || String(post.content || '').slice(0, 80),
        status: post.status,
        communityId: post.communityId,
        authorId: post.authorId || post.userId,
        commentsCount: post.comments?.length ?? 0,
        reactionsCount: post.reactions?.length ?? 0,
      })));
    }
    if (!requested || requested.has('event') || requested.has('events')) {
      rows.push(...await this.loadContentModel(this.eventModel, 'event', dateQuery, limit, (event) => ({
        title: event.title,
        status: event.status,
        communityId: event.communityId,
        creatorId: event.creatorId,
        startDate: event.startDate,
        attendeesCount: event.attendees?.length ?? 0,
      })));
    }
    if (!requested || requested.has('product') || requested.has('products')) {
      rows.push(...await this.loadContentModel(this.productModel, 'product', dateQuery, limit, (product) => ({
        title: product.title,
        status: product.status,
        communityId: product.communityId,
        creatorId: product.creatorId,
        price: product.price,
      })));
    }

    if (rows.length === 0 && !this.courseModel && !this.postModel && !this.eventModel && !this.productModel) {
      return this.unavailableRows(ExportType.CONTENT);
    }

    return rows
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, this.getLimit(filters));
  }

  private async loadContentModel(
    model: Model<any> | undefined,
    contentType: string,
    baseQuery: Record<string, any>,
    limit: number,
    mapExtra: (doc: any) => Record<string, any>,
  ): Promise<Record<string, any>[]> {
    if (!model) return [];
    const docs = await model.find(baseQuery).sort({ createdAt: -1 }).limit(limit).lean().exec();
    return docs.map((doc: any) => ({
      id: this.stringifyId(doc._id),
      contentType,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      ...mapExtra(doc),
    }));
  }

  private async loadFinancial(filters: Record<string, any>): Promise<Record<string, any>[]> {
    const rows: Record<string, any>[] = [];
    const limit = Math.max(1, Math.floor(this.getLimit(filters) / 4));
    const orderQuery: Record<string, any> = {};
    const subscriptionQuery: Record<string, any> = {};
    const walletTransactionQuery: Record<string, any> = {};
    const payoutQuery: Record<string, any> = {};
    const requestedTypes = new Set(
      this.toStringArray(filters.type ?? filters.types ?? filters.recordType)
        .map((type) => type.toLowerCase()),
    );
    const shouldInclude = (type: string) => !requestedTypes.size || requestedTypes.has(type);

    const statuses = this.toStringArray(filters.status ?? filters.statuses);
    if (statuses.length) {
      this.assignInFilter(orderQuery, 'status', this.mapFinancialStatuses(statuses, 'order'));
      this.assignInFilter(subscriptionQuery, 'status', this.mapFinancialStatuses(statuses, 'subscription'));
      this.assignInFilter(payoutQuery, 'status', this.mapFinancialStatuses(statuses, 'payout'));
    }
    if (filters.currency) subscriptionQuery.currency = String(filters.currency).toUpperCase();
    this.assignDateRange(orderQuery, 'createdAt', filters, ['dateRange']);
    this.assignDateRange(subscriptionQuery, 'createdAt', filters, ['dateRange']);
    this.assignDateRange(walletTransactionQuery, 'createdAt', filters, ['dateRange']);
    this.assignDateRange(payoutQuery, 'createdAt', filters, ['dateRange']);

    if (this.orderModel && shouldInclude('order')) {
      const orders = await this.orderModel.find(orderQuery).sort({ createdAt: -1 }).limit(limit).lean().exec();
      rows.push(...orders.map((order: any) => ({
        id: this.stringifyId(order._id),
        type: 'order',
        amount: order.amountDT,
        currency: 'TND',
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentId: order.paymentId,
        buyerId: order.buyerId,
        creatorId: order.creatorId,
        communityId: order.communityId,
        contentType: order.contentType,
        platformFee: order.platformFeeDT,
        creatorNet: order.creatorNetDT,
        createdAt: order.createdAt,
      })));
    }

    if (this.subscriptionModel && shouldInclude('subscription')) {
      const subscriptions = await this.subscriptionModel.find(subscriptionQuery).sort({ createdAt: -1 }).limit(limit).lean().exec();
      rows.push(...subscriptions.map((subscription: any) => ({
        id: this.stringifyId(subscription._id),
        type: 'subscription',
        amount: subscription.amount,
        currency: subscription.currency || 'TND',
        status: subscription.status,
        plan: subscription.plan || subscription.planTier,
        userId: subscription.userId || subscription.subscriberId,
        creatorId: subscription.creatorId,
        communityId: subscription.communityId,
        startDate: subscription.startDate || subscription.currentPeriodStart,
        endDate: subscription.endDate || subscription.currentPeriodEnd,
        createdAt: subscription.createdAt,
      })));
    }

    if (this.walletTransactionModel && shouldInclude('wallet_transaction') && !statuses.length) {
      const transactions = await this.walletTransactionModel.find(walletTransactionQuery).sort({ createdAt: -1 }).limit(limit).lean().exec();
      rows.push(...transactions.map((transaction: any) => ({
        id: this.stringifyId(transaction._id),
        type: 'wallet_transaction',
        transactionType: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency || 'TND',
        userId: transaction.userId,
        contentType: transaction.contentType,
        contentId: transaction.contentId,
        orderId: transaction.orderId,
        reference: transaction.reference,
        description: transaction.description,
        balanceBefore: transaction.balanceBefore,
        balanceAfter: transaction.balanceAfter,
        createdAt: transaction.createdAt,
      })));
    }

    if (this.payoutModel && shouldInclude('payout')) {
      const payouts = await this.payoutModel.find(payoutQuery).sort({ createdAt: -1 }).limit(limit).lean().exec();
      rows.push(...payouts.map((payout: any) => ({
        id: this.stringifyId(payout._id),
        type: 'payout',
        amount: payout.amount,
        currency: payout.currency || 'TND',
        status: payout.status,
        method: payout.method,
        creatorId: payout.creatorId,
        communityId: payout.communityId,
        reference: payout.reference,
        requestedAt: payout.requestedAt,
        processedAt: payout.processedAt,
        scheduledFor: payout.scheduledFor,
        createdAt: payout.createdAt,
      })));
    }

    if (rows.length === 0 && !this.orderModel && !this.subscriptionModel && !this.walletTransactionModel && !this.payoutModel) {
      return this.unavailableRows(ExportType.FINANCIAL);
    }

    return rows
      .sort((a, b) => new Date(b.createdAt || b.startDate || 0).getTime() - new Date(a.createdAt || a.startDate || 0).getTime())
      .slice(0, this.getLimit(filters));
  }

  private async loadAuditLogs(filters: Record<string, any>): Promise<Record<string, any>[]> {
    if (!this.auditLogModel) return this.unavailableRows(ExportType.AUDIT_LOGS);

    const query: Record<string, any> = {};
    if (filters.action) query.action = String(filters.action);
    if (filters.entityType) query.entityType = String(filters.entityType);
    const statuses = this.toStringArray(filters.status ?? filters.statuses);
    if (statuses.length) this.assignInFilter(query, 'status', statuses);
    if (filters.adminUserId && Types.ObjectId.isValid(String(filters.adminUserId))) {
      query.adminUserId = new Types.ObjectId(String(filters.adminUserId));
    }
    if (filters.entityId && Types.ObjectId.isValid(String(filters.entityId))) {
      query.entityId = new Types.ObjectId(String(filters.entityId));
    }
    if (filters.ipAddress) query.ipAddress = String(filters.ipAddress);
    if (filters.searchTerm || filters.search) {
      const regex = new RegExp(this.escapeRegExp(String(filters.searchTerm ?? filters.search)), 'i');
      query.$or = [{ action: regex }, { entityType: regex }, { description: regex }, { status: regex }];
    }
    this.assignDateRange(query, 'timestamp', filters, ['dateRange']);

    const logs = await this.auditLogModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(this.getLimit(filters))
      .lean()
      .exec();

    return logs.map((log: any) => ({
      id: this.stringifyId(log._id),
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      adminUserId: log.adminUserId,
      status: log.status,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      timestamp: log.timestamp || log.createdAt,
      description: log.description,
      errorMessage: log.errorMessage,
    }));
  }

  private async loadAnalytics(filters: Record<string, any>): Promise<Record<string, any>[]> {
    const dateQuery: Record<string, any> = {};
    this.assignDateRange(dateQuery, 'createdAt', filters, ['period', 'dateRange']);
    const paidOrderQuery = { ...dateQuery, status: 'paid' };

    const [
      totalUsers,
      newUsers,
      totalCommunities,
      newCommunities,
      totalOrders,
      revenueAgg,
      activeSubscriptions,
      totalCourses,
      totalPosts,
      totalEvents,
      totalProducts,
    ] = await Promise.all([
      this.userModel?.countDocuments({}) ?? 0,
      this.userModel?.countDocuments(dateQuery) ?? 0,
      this.communityModel?.countDocuments({}) ?? 0,
      this.communityModel?.countDocuments(dateQuery) ?? 0,
      this.orderModel?.countDocuments(paidOrderQuery) ?? 0,
      this.orderModel?.aggregate([
        { $match: paidOrderQuery },
        { $group: { _id: null, revenue: { $sum: '$amountDT' }, platformFees: { $sum: '$platformFeeDT' } } },
      ]) ?? [],
      this.subscriptionModel?.countDocuments({ status: { $in: ['active', 'trialing'] } }) ?? 0,
      this.courseModel?.countDocuments({}) ?? 0,
      this.postModel?.countDocuments({}) ?? 0,
      this.eventModel?.countDocuments({}) ?? 0,
      this.productModel?.countDocuments({}) ?? 0,
    ]);

    const revenue = revenueAgg[0] || {};
    return [{
      periodStart: dateQuery.createdAt?.$gte,
      periodEnd: dateQuery.createdAt?.$lte,
      totalUsers,
      newUsers,
      totalCommunities,
      newCommunities,
      paidOrders: totalOrders,
      revenue: revenue.revenue || 0,
      platformFees: revenue.platformFees || 0,
      activeSubscriptions,
      totalContent: totalCourses + totalPosts + totalEvents + totalProducts,
      totalCourses,
      totalPosts,
      totalEvents,
      totalProducts,
      generatedAt: new Date(),
    }];
  }

  private convertToCSV(data: any[], selectedFields?: string[]): string {
    const headers: string[] = selectedFields?.length
      ? selectedFields
      : Array.from(data.reduce<Set<string>>((set, row) => {
          Object.keys(row || {}).forEach((key) => set.add(key));
          return set;
        }, new Set<string>()));

    if (!headers.length) return '';

    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  private convertToExcelHtml(data: any[], job: ExportJob): string {
    const headers: string[] = job.fields?.length
      ? job.fields
      : Array.from(data.reduce<Set<string>>((set, row) => {
          Object.keys(row || {}).forEach((key) => set.add(key));
          return set;
        }, new Set<string>()));

    const headerCells = headers.map((header) => `<th>${this.escapeHtml(header)}</th>`).join('');
    const bodyRows = data.map((row) => {
      const cells = headers.map((header) => `<td>${this.escapeHtml(this.formatCell(row?.[header]))}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return [
      '<!doctype html>',
      '<html><head><meta charset="utf-8"></head><body>',
      `<h1>Admin export: ${this.escapeHtml(job.type)}</h1>`,
      `<p>Generated at ${new Date().toISOString()}</p>`,
      '<table border="1">',
      `<thead><tr>${headerCells}</tr></thead>`,
      `<tbody>${bodyRows}</tbody>`,
      '</table>',
      '</body></html>',
    ].join('');
  }

  private convertToPdfText(envelope: Record<string, any>): string {
    const lines = [
      `Admin export: ${envelope.exportType}`,
      `Generated at: ${envelope.generatedAt}`,
      `Records: ${envelope.recordCount}`,
      '',
      ...JSON.stringify(envelope.data, null, 2).split('\n').slice(0, 90),
    ];

    const escaped = lines.map((line) => `(${this.escapePdf(line).slice(0, 110)}) Tj`).join('\nT*\n');
    const stream = `BT\n/F1 9 Tf\n36 806 Td\n12 TL\n${escaped}\nET`;
    const objects = [
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
      '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
      `5 0 obj << /Length ${Buffer.byteLength(stream, 'utf8')} >> stream\n${stream}\nendstream endobj`,
    ];

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (const object of objects) {
      offsets.push(Buffer.byteLength(pdf, 'utf8'));
      pdf += `${object}\n`;
    }

    const xrefOffset = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i < offsets.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return pdf;
  }

  private getDownloadUrl(jobId: string): string {
    return `/api/admin/export/jobs/${jobId}/download`;
  }

  private applyFieldSelection(rows: Record<string, any>[], fields?: string[]): Record<string, any>[] {
    if (!fields?.length) return rows;
    return rows.map((row) => fields.reduce((selected, field) => {
      selected[field] = row[field] ?? row[this.aliasField(field)];
      return selected;
    }, {} as Record<string, any>));
  }

  private aliasField(field: string): string {
    if (field === 'id') return '_id';
    if (field === 'lastLoginAt') return 'lastActive';
    if (field === 'amount') return 'amountDT';
    return field;
  }

  private normalizeRow(value: any): Record<string, any> {
    const row = Object.entries(value || {}).reduce((acc, [key, cell]) => {
      acc[key] = this.normalizeValue(cell);
      return acc;
    }, {} as Record<string, any>);
    if (!row.id && row._id) row.id = row._id;
    return row;
  }

  private normalizeValue(value: any): any {
    if (value instanceof Date) return value.toISOString();
    if (value instanceof Types.ObjectId) return value.toString();
    if (Array.isArray(value)) return value.map((item) => this.normalizeValue(item));
    if (value && typeof value === 'object') {
      if (typeof value.toHexString === 'function') return value.toString();
      return Object.entries(value).reduce((acc, [key, nested]) => {
        acc[key] = this.normalizeValue(nested);
        return acc;
      }, {} as Record<string, any>);
    }
    return value;
  }

  private formatCell(value: any): string {
    if (value === undefined || value === null) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  private assignDateRange(
    query: Record<string, any>,
    field: string,
    filters: Record<string, any>,
    nestedKeys: string[] = [],
  ): void {
    const range = nestedKeys
      .map((key) => filters[key])
      .find((candidate) => candidate && typeof candidate === 'object') || {};

    const startDate = filters.startDate || filters.createdFrom || filters.registeredFrom || range.startDate || range.from;
    const endDate = filters.endDate || filters.createdTo || filters.registeredTo || range.endDate || range.to;
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    if (Object.keys(dateFilter).length) query[field] = dateFilter;
  }

  private assignInFilter(query: Record<string, any>, field: string, values: string[]): void {
    const uniqueValues = Array.from(new Set(values.filter(Boolean)));
    if (!uniqueValues.length) return;
    query[field] = uniqueValues.length === 1 ? uniqueValues[0] : { $in: uniqueValues };
  }

  private mapFinancialStatuses(statuses: string[], source: 'order' | 'subscription' | 'payout'): string[] {
    return statuses.map((status) => {
      if (source === 'order' && status === 'completed') return 'paid';
      if (source === 'subscription' && status === 'completed') return 'active';
      if (source === 'subscription' && status === 'cancelled') return 'canceled';
      return status;
    });
  }

  private getCommunityStatus(community: Record<string, any>): string {
    if (community.isSuspended) return 'suspended';
    if (community.approvalStatus === 'rejected') return 'rejected';
    if (community.isActive) return 'active';
    if (community.approvalStatus === 'approved') return 'approved';
    if (community.approvalStatus === 'pending' || !community.approvalStatus) return 'pending';
    return community.approvalStatus || 'inactive';
  }

  private toStringArray(value: any): string[] {
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === 'string' && value.includes(',')) {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
    return value ? [String(value)] : [];
  }

  private getLimit(filters: Record<string, any>): number {
    const limit = Number(filters.limit || filters.maxRecords || 5000);
    return Math.min(Math.max(Number.isFinite(limit) ? limit : 5000, 1), 25000);
  }

  private stringifyId(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value.toHexString === 'function') return value.toString();
    if (value._id) return this.stringifyId(value._id);
    return String(value);
  }

  private toObjectId(value: any): Types.ObjectId {
    if (value instanceof Types.ObjectId) return value;
    const raw = this.stringifyId(value);
    return Types.ObjectId.isValid(raw) ? new Types.ObjectId(raw) : new Types.ObjectId();
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private escapePdf(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  private unavailableRows(type: ExportType): Record<string, any>[] {
    return [{
      id: `${type}-unavailable`,
      type,
      status: 'unavailable',
      message: `No ${type} data model is registered in this execution context`,
      generatedAt: new Date().toISOString(),
    }];
  }
}
