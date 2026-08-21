import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHmac, timingSafeEqual } from 'crypto';
import { Model, Types } from 'mongoose';
import {
  CampaignStatsDto,
  CreateContentReminderDto,
  CreateCourseProgressCampaignDto,
  CreateEmailCampaignDto,
  CreateInactiveUserCampaignDto,
  CreateWelcomeTemplateDto,
  EmailCampaignQueryDto,
  InactiveUserQueryDto,
  InactiveUserStatsDto,
  MarketingMergeFieldsQueryDto,
  MarketingTemplatesQueryDto,
  PreviewAudienceDto,
  PreviewAudienceResponseDto,
  RenderMarketingPreviewDto,
  UpdateEmailCampaignDto,
  UpdateWelcomeTemplateDto,
} from '@/domains/communication/email-campaign/dto/email-campaign.dto';
import { EmailService } from '@/shared/services/email.service';
import { Community, CommunityDocument } from '@/infrastructure/database/schemas/community/community.schema';
import {
  AutomationEventTrigger,
  EmailCampaign,
  EmailCampaignDocument,
  EmailCampaignStatus,
  EmailCampaignType,
  EmailRecipient,
  InactivityPeriod,
} from '@/infrastructure/database/schemas/communication/email-campaign.schema';
import { User, UserDocument } from '@/infrastructure/database/schemas/auth/user.schema';
import { UserLoginActivityDocument } from '@/infrastructure/database/schemas/auth/user-login-activity.schema';
import { UserLoginActivityService } from '@/domains/auth/user-login-activity/user-login-activity.service';
import { contentTypeToLabel, inactivityPeriodToText, renderTemplate } from '@/domains/communication/email-campaign/email-campaign-template.util';
import { MARKETING_EMAIL_TEMPLATES, MarketingEmailTemplate } from '@/domains/communication/email-campaign/email-marketing-templates';
import { EmailCampaignQueueService } from '@/domains/communication/email-campaign/email-campaign.queue';
import { PolicyService } from '@/shared/services/policy.service';
import { Subscription, SubscriptionDocument } from '@/infrastructure/database/schemas/commerce/subscription.schema';
import { EmailCampaignSendJobPayload } from '@/domains/communication/email-campaign/email-campaign.jobs';
import { Cours } from '@/infrastructure/database/schemas/learning/course.schema';
import { Challenge } from '@/infrastructure/database/schemas/learning/challenge.schema';
import { Event } from '@/infrastructure/database/schemas/commerce/event.schema';
import { Product } from '@/infrastructure/database/schemas/commerce/product.schema';
import { Session } from '@/infrastructure/database/schemas/commerce/session.schema';
import { HtmlSanitizerService } from '@/shared/services/html-sanitizer.service';

type RecipientsQuery = { page?: number; limit?: number; status?: string; opened?: boolean };
type SendRecipientResult = { authenticationFailure: boolean };
type TrackingEventType = 'open' | 'click';
type MarketingContentType = 'event' | 'challenge' | 'cours' | 'product' | 'session' | 'all';
type MarketingMergeField = {
  key: string;
  token: string;
  label: string;
  group: string;
  type: 'string' | 'number' | 'date' | 'url' | 'boolean';
  description: string;
  example: string | number | boolean;
  source: 'user' | 'community' | 'engagement' | 'content' | 'course' | 'campaign' | 'system';
  availability: string[];
};
type MarketingContentData = Record<string, string | number | boolean | null | undefined>;
type TrackingTokenPayload = {
  v: 1;
  type: TrackingEventType;
  campaignId: string;
  recipientUserId: string;
  recipientEmail: string;
  exp: number;
  url?: string;
};

const TRACKING_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 365; // 1 year
const DEFAULT_TRACKING_SECRET = 'local-dev-email-tracking-secret-change-me';
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  'R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
  'base64',
);

@Injectable()
export class EmailCampaignService {
  private readonly logger = new Logger(EmailCampaignService.name);

  constructor(
    @InjectModel(EmailCampaign.name)
    private readonly emailCampaignModel: Model<EmailCampaignDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Community.name)
    private readonly communityModel: Model<CommunityDocument>,
    @InjectModel(Cours.name)
    private readonly coursModel: Model<any>,
    @InjectModel(Challenge.name)
    private readonly challengeModel: Model<any>,
    @InjectModel(Event.name)
    private readonly eventModel: Model<any>,
    @InjectModel(Product.name)
    private readonly productModel: Model<any>,
    @InjectModel(Session.name)
    private readonly sessionModel: Model<any>,
    @InjectModel('CourseEnrollment')
    private readonly courseEnrollmentModel: Model<any>,
    @InjectModel('UserLoginActivity')
    private readonly userLoginActivityModel: Model<any>,
    private readonly emailService: EmailService,
    private readonly userLoginActivityService: UserLoginActivityService,
    private readonly emailCampaignQueueService: EmailCampaignQueueService,
    private readonly policyService: PolicyService,
    private readonly htmlSanitizer: HtmlSanitizerService,
  ) {}

  private sanitizeCampaignContent(content: string, isHtml?: boolean): string {
    return isHtml ? this.htmlSanitizer.sanitizeHtml(content) : content;
  }

  /**
   * Validate that the creator has remaining email campaign quota for the month.
   * Skipped when PLAN_ENFORCEMENT_MODE=false.
   */
  private async validateEmailCampaignQuota(creatorId: string, recipientCount: number): Promise<void> {
    const enforcementOn = process.env.PLAN_ENFORCEMENT_MODE === 'true';
    if (!enforcementOn) return;

    // Count recipients already sent to this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const usedThisMonth = await this.emailCampaignModel.aggregate([
      {
        $match: {
          creatorId: new (await import('mongoose')).Types.ObjectId(creatorId),
          createdAt: { $gte: monthStart },
          status: { $in: ['sent', 'sending', 'scheduled'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalRecipients' } } },
    ]);
    const used = usedThisMonth[0]?.total ?? 0;

    const remaining = await this.policyService.getRemainingQuota(
      creatorId,
      'emailCampaign',
      used,
    );

    if (remaining < recipientCount) {
      const limits = await this.policyService.getEffectiveLimitsForCreator(creatorId);
      throw new ForbiddenException(
        `Email campaign quota exceeded. Used ${used}/${limits.emailCampaignRecipientsPerMonth} recipients this month. ` +
        `Cannot send to ${recipientCount} additional recipients. Please upgrade your plan.`,
      );
    }
  }

  async createCampaign(creatorId: string, dto: CreateEmailCampaignDto): Promise<EmailCampaignDocument> {
    const community = await this.verifyCommunityAccess(creatorId, dto.communityId);
    const recipients = await this.buildCommunityRecipients(community);

    // Enforce email campaign quota
    await this.validateEmailCampaignQuota(creatorId, recipients.length);
    const scheduledAt = this.normalizeScheduledAt(dto.scheduledAt);
    const status = this.resolveCampaignStatus(scheduledAt);

    const campaign = new this.emailCampaignModel({
      title: dto.title,
      subject: dto.subject,
      content: this.sanitizeCampaignContent(dto.content, dto.isHtml),
      communityId: new Types.ObjectId(dto.communityId),
      creatorId: new Types.ObjectId(creatorId),
      recipients,
      totalRecipients: recipients.length,
      scheduledAt,
      type: dto.type || EmailCampaignType.CUSTOM,
      status,
      isHtml: dto.isHtml || false,
      templateData: dto.templateData || {},
      trackOpens: dto.trackOpens !== false,
      trackClicks: dto.trackClicks !== false,
      metadata: dto.metadata || {},
    });

    const savedCampaign = await campaign.save();
    await this.enqueueIfScheduled(savedCampaign, creatorId, 'scheduled');

    this.logger.log(
      `Created campaign ${savedCampaign._id.toString()} for community ${dto.communityId} with ${recipients.length} recipients`,
    );

    return savedCampaign;
  }

  async createInactiveUserCampaign(
    creatorId: string,
    dto: CreateInactiveUserCampaignDto,
  ): Promise<EmailCampaignDocument> {
    const community = await this.verifyCommunityAccess(creatorId, dto.communityId);
    const inactiveUsers = await this.getInactiveUsersForCampaign(dto);
    const recipients = inactiveUsers.map((userActivity) => {
      const user = userActivity.userId as any;
      return {
        userId: user._id,
        email: user.email,
        name: user.name,
        status: 'pending',
        opened: false,
        clickCount: 0,
        mergeData: this.buildActivityMarketingData(userActivity, dto.inactivityPeriod as InactivityPeriod),
      } as EmailRecipient;
    });

    const scheduledAt = this.normalizeScheduledAt(dto.scheduledAt);
    const status = this.resolveCampaignStatus(scheduledAt);
    const targetDaysThreshold = this.getDaysThreshold(dto.inactivityPeriod as InactivityPeriod);

    const campaign = new this.emailCampaignModel({
      title: dto.title,
      subject: dto.subject,
      content: this.sanitizeCampaignContent(dto.content, dto.isHtml),
      communityId: new Types.ObjectId(dto.communityId),
      creatorId: new Types.ObjectId(creatorId),
      recipients,
      totalRecipients: recipients.length,
      isInactiveUserCampaign: true,
      targetInactivityPeriod: dto.inactivityPeriod,
      targetDaysThreshold,
      targetAllInactive: dto.targetAllInactive || false,
      scheduledAt,
      type: EmailCampaignType.INACTIVE_USER_REACTIVATION,
      status,
      trackOpens: dto.trackOpens !== false,
      trackClicks: dto.trackClicks !== false,
      isHtml: dto.isHtml || false,
      metadata: {
        ...dto.metadata,
        reactivationCampaign: true,
        targetPeriod: dto.inactivityPeriod,
        targetDaysThreshold,
        communityName: community.name,
      },
    });

    const savedCampaign = await campaign.save();
    await this.enqueueIfScheduled(savedCampaign, creatorId, 'scheduled');

    return savedCampaign;
  }

  async createAndSendContentReminder(
    creatorId: string,
    dto: CreateContentReminderDto,
  ): Promise<{ campaignId: string; queued: true }> {
    const community = await this.verifyCommunityAccess(creatorId, dto.communityId);
    const recipients = await this.buildCommunityRecipients(community);
    const scheduledAt = this.normalizeScheduledAt(dto.scheduledAt);
    const status = this.resolveCampaignStatus(scheduledAt);
    const contentData = await this.resolveContentMarketingData(
      community,
      dto.contentType as MarketingContentType,
      dto.contentId,
    );

    const campaign = new this.emailCampaignModel({
      title: dto.title,
      subject: dto.subject,
      content: this.sanitizeCampaignContent(dto.content, dto.isHtml),
      communityId: new Types.ObjectId(dto.communityId),
      creatorId: new Types.ObjectId(creatorId),
      recipients,
      totalRecipients: recipients.length,
      scheduledAt,
      type: EmailCampaignType.CUSTOM,
      status,
      templateData: contentData,
      trackOpens: dto.trackOpens !== false,
      trackClicks: dto.trackClicks !== false,
      isHtml: dto.isHtml || false,
      metadata: {
        ...dto.metadata,
        contentReminder: true,
        contentType: dto.contentType,
        contentId: dto.contentId,
        ...contentData,
        communityName: community.name,
      },
    });

    const savedCampaign = await campaign.save();
    await this.emailCampaignQueueService.queueCampaignSend(
      {
        campaignId: savedCampaign._id.toString(),
        requestedBy: creatorId,
        trigger: scheduledAt ? 'scheduled' : 'content-reminder',
      },
      scheduledAt,
    );

    return { campaignId: savedCampaign._id.toString(), queued: true };
  }

  // ─── Course Progress Campaign ───────────────────────────────────────────────

  async createCourseProgressCampaign(
    creatorId: string,
    dto: CreateCourseProgressCampaignDto,
  ): Promise<EmailCampaignDocument> {
    const community = await this.verifyCommunityAccess(creatorId, dto.communityId);
    if (!Types.ObjectId.isValid(dto.targetCourseId)) {
      throw new BadRequestException('Invalid targetCourseId');
    }

    const recipients = await this.resolveCourseProgressAudience(
      dto.communityId,
      dto.targetCourseId,
      dto.targetMaxProgressPct,
      dto.targetMinEnrolledDays,
      dto.maxRecipients || 5000,
    );

    const scheduledAt = this.normalizeScheduledAt(dto.scheduledAt);
    const status = this.resolveCampaignStatus(scheduledAt);
    const courseData = await this.resolveContentMarketingData(community, 'cours', dto.targetCourseId);

    const campaign = new this.emailCampaignModel({
      title: dto.title,
      subject: dto.subject,
      content: this.sanitizeCampaignContent(dto.content, dto.isHtml),
      communityId: new Types.ObjectId(dto.communityId),
      creatorId: new Types.ObjectId(creatorId),
      recipients,
      totalRecipients: recipients.length,
      isCourseProgressCampaign: true,
      targetCourseId: new Types.ObjectId(dto.targetCourseId),
      targetMaxProgressPct: dto.targetMaxProgressPct,
      targetMinEnrolledDays: dto.targetMinEnrolledDays,
      type: EmailCampaignType.COURSE_PROGRESS_REMINDER,
      scheduledAt,
      status,
      isHtml: dto.isHtml || false,
      templateData: courseData,
      trackOpens: dto.trackOpens !== false,
      trackClicks: dto.trackClicks !== false,
      metadata: {
        ...courseData,
        communityName: community.name,
        courseProgressReminder: true,
        targetCourseId: dto.targetCourseId,
        targetMaxProgressPct: dto.targetMaxProgressPct,
        targetMinEnrolledDays: dto.targetMinEnrolledDays,
      },
    });

    const savedCampaign = await campaign.save();
    await this.enqueueIfScheduled(savedCampaign, creatorId, 'scheduled');

    this.logger.log(
      `Created course progress campaign ${savedCampaign._id.toString()} — ${recipients.length} recipients (progress < ${dto.targetMaxProgressPct}%, enrolled >= ${dto.targetMinEnrolledDays}d)`,
    );
    return savedCampaign;
  }

  // ─── Audience Preview ───────────────────────────────────────────────────────

  async previewCampaignAudience(creatorId: string, dto: PreviewAudienceDto): Promise<PreviewAudienceResponseDto> {
    await this.verifyCommunityAccess(creatorId, dto.communityId);

    if (dto.filterType === 'inactivity') {
      if (!dto.inactiveFilter) {
        throw new BadRequestException('inactiveFilter is required for filterType=inactivity');
      }
      const cutoff = new Date(Date.now() - dto.inactiveFilter.minInactiveDays * 24 * 60 * 60 * 1000);
      const activities = await this.userLoginActivityModel
        .find({
          communityId: new Types.ObjectId(dto.communityId),
          lastLoginAt: { $lt: cutoff },
        })
        .populate('userId', 'email name')
        .limit(1000)
        .lean()
        .exec();

      const sample = activities.slice(0, 10).map((a: any) => ({
        userId: String(a.userId?._id || a.userId),
        email: a.userId?.email || '',
        name: a.userId?.name || '',
      }));

      return { total: activities.length, sample, filterType: 'inactivity' };
    }

    if (dto.filterType === 'course_progress') {
      if (!dto.courseProgressFilter) {
        throw new BadRequestException('courseProgressFilter is required for filterType=course_progress');
      }
      const { courseId, maxProgressPct, minEnrolledDays } = dto.courseProgressFilter;
      if (!Types.ObjectId.isValid(courseId)) {
        throw new BadRequestException('Invalid courseId');
      }
      const recipients = await this.resolveCourseProgressAudience(
        dto.communityId,
        courseId,
        maxProgressPct,
        minEnrolledDays,
        1000,
      );

      const sample = recipients.slice(0, 10).map((r) => ({
        userId: String(r.userId),
        email: r.email,
        name: r.name,
      }));

      return { total: recipients.length, sample, filterType: 'course_progress' };
    }

    throw new BadRequestException('Unsupported filterType');
  }

  async getMarketingMergeFields(
    creatorId: string,
    communityId: string,
    query: MarketingMergeFieldsQueryDto = {},
  ): Promise<{
    communityId: string;
    syntax: { tokenExample: string; description: string };
    groups: Array<{ key: string; label: string; fields: MarketingMergeField[] }>;
    fields: MarketingMergeField[];
    sampleData: Record<string, any>;
    dataSummary: Record<string, any>;
  }> {
    const community = await this.verifyCommunityAccess(creatorId, communityId);
    const sampleData = await this.buildMarketingPreviewVariables(creatorId, community, {
      campaignType: query.campaignType,
      contentType: query.contentType,
      contentId: query.contentId,
      targetCourseId: query.targetCourseId,
      inactivityPeriod: query.inactivityPeriod,
    });
    const fields = this.buildMarketingMergeFieldCatalog(sampleData, {
      campaignType: query.campaignType,
      contentType: query.contentType,
      targetCourseId: query.targetCourseId,
      inactivityPeriod: query.inactivityPeriod,
    });
    const dataSummary = await this.buildMarketingDataSummary(community);

    return {
      communityId,
      syntax: {
        tokenExample: '{{userFirstName}}',
        description: 'Use double curly braces around any key. Unknown variables render as empty strings during send.',
      },
      groups: this.groupMarketingFields(fields),
      fields,
      sampleData,
      dataSummary,
    };
  }

  async getMarketingTemplates(
    creatorId: string,
    communityId: string,
    query: MarketingTemplatesQueryDto = {},
  ): Promise<{
    communityId: string;
    templates: Array<MarketingEmailTemplate & { variables: string[]; renderedPreview: { subject: string; content: string } }>;
    categories: string[];
    total: number;
  }> {
    const community = await this.verifyCommunityAccess(creatorId, communityId);
    const sampleData = await this.buildMarketingPreviewVariables(creatorId, community, {
      campaignType: query.type,
      contentType: query.contentType,
    });

    const templates = MARKETING_EMAIL_TEMPLATES
      .filter((template) => !query.type || template.type === query.type)
      .filter((template) => !query.contentType || !template.contentType || template.contentType === query.contentType || template.contentType === 'all')
      .filter((template) => !query.category || template.category === query.category)
      .map((template) => ({
        ...template,
        variables: this.extractTemplateTokens(`${template.subject}\n${template.content}`),
        renderedPreview: {
          subject: renderTemplate(template.subject, sampleData),
          content: renderTemplate(template.content, sampleData),
        },
      }));

    return {
      communityId,
      templates,
      categories: Array.from(new Set(MARKETING_EMAIL_TEMPLATES.map((template) => template.category))).sort(),
      total: templates.length,
    };
  }

  async renderMarketingPreview(
    creatorId: string,
    dto: RenderMarketingPreviewDto,
  ): Promise<{
    subject: string;
    content: string;
    isHtml: boolean;
    variables: Record<string, any>;
    usedVariables: string[];
    missingVariables: string[];
    recipient?: { userId: string; email: string; name: string };
    contentData: MarketingContentData;
  }> {
    const community = await this.verifyCommunityAccess(creatorId, dto.communityId);
    const variables = await this.buildMarketingPreviewVariables(creatorId, community, {
      campaignType: dto.campaignType,
      contentType: dto.contentType,
      contentId: dto.contentId,
      targetCourseId: dto.targetCourseId,
      inactivityPeriod: dto.inactivityPeriod,
      sampleUserId: dto.sampleUserId,
      metadata: dto.metadata,
    });
    const subjectTemplate = dto.subject || '';
    const usedVariables = this.extractTemplateTokens(`${subjectTemplate}\n${dto.content}`);
    const knownKeys = new Set(Object.keys(variables));
    const missingVariables = usedVariables.filter((key) => !knownKeys.has(key));
    const renderedContent = renderTemplate(dto.content, variables);

    return {
      subject: renderTemplate(subjectTemplate, variables),
      content: this.sanitizeCampaignContent(renderedContent, dto.isHtml === true),
      isHtml: dto.isHtml === true,
      variables,
      usedVariables,
      missingVariables,
      recipient: variables.userId
        ? {
            userId: String(variables.userId),
            email: String(variables.userEmail || ''),
            name: String(variables.userName || ''),
          }
        : undefined,
      contentData: this.pickMarketingDataByPrefix(variables, ['content', 'course', 'event', 'challenge', 'product', 'session']),
    };
  }

  private async resolveCourseProgressAudience(
    communityId: string,
    courseId: string,
    maxProgressPct: number,
    minEnrolledDays: number,
    limit: number,
  ): Promise<EmailRecipient[]> {
    const enrolledBefore = new Date(Date.now() - minEnrolledDays * 24 * 60 * 60 * 1000);
    const course = typeof (this.coursModel as any).findById === 'function'
      ? await (this.coursModel as any).findById(courseId).lean().exec().catch(() => null)
      : null;

    // Fetch enrollments for this course created before the threshold
    const enrollments = await this.courseEnrollmentModel
      .find({
        courseId: new Types.ObjectId(courseId),
        isActive: true,
        createdAt: { $lte: enrolledBefore },
      })
      .populate('userId', '_id email name')
      .limit(limit * 2) // over-fetch before filtering
      .lean()
      .exec();

    // Get community member IDs for scoping
    const community = await this.communityModel
      .findById(communityId)
      .select('members name slug currency')
      .lean()
      .exec();

    const memberIds = new Set((community?.members || []).map((m: any) => String(m)));

    const qualifying: EmailRecipient[] = [];

    for (const enrollment of enrollments) {
      const user = enrollment.userId as any;
      if (!user || !memberIds.has(String(user._id))) continue;

      const totalChapters = this.countCourseChapters(course, enrollment);
      const progressEntries: Array<{ isCompleted: boolean }> = enrollment.progression || [];
      const completedChapters = progressEntries.filter((p) => p.isCompleted).length;
      const progressPct = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

      if (progressPct < maxProgressPct) {
        qualifying.push({
          userId: user._id,
          email: user.email,
          name: user.name || user.email,
          status: 'pending',
          opened: false,
          clickCount: 0,
          mergeData: {
            ...this.normalizeContentMarketingData('cours', course || { _id: courseId }, community || {}),
            ...this.buildCourseProgressMergeData(course || { _id: courseId }, enrollment),
          },
        } as EmailRecipient);
      }

      if (qualifying.length >= limit) break;
    }

    return qualifying;
  }

  // ─── Welcome Automation Template ────────────────────────────────────────────

  async createWelcomeTemplate(
    creatorId: string,
    communityId: string,
    dto: CreateWelcomeTemplateDto,
  ): Promise<EmailCampaignDocument> {
    const community = await this.verifyCommunityAccess(creatorId, communityId);

    // Deactivate any existing welcome template for this community
    await this.emailCampaignModel
      .updateMany(
        {
          communityId: new Types.ObjectId(communityId),
          isAutomationTemplate: true,
          eventTrigger: AutomationEventTrigger.COMMUNITY_JOIN,
        },
        { $set: { automationActive: false } },
      )
      .exec();

    const template = new this.emailCampaignModel({
      title: `Welcome Email — ${community.name}`,
      subject: dto.subject,
      content: this.sanitizeCampaignContent(dto.content, dto.isHtml),
      communityId: new Types.ObjectId(communityId),
      creatorId: new Types.ObjectId(creatorId),
      type: EmailCampaignType.WELCOME,
      status: EmailCampaignStatus.SENT, // templates are always "active", not in send queue
      isHtml: dto.isHtml ?? false,
      isAutomationTemplate: true,
      eventTrigger: AutomationEventTrigger.COMMUNITY_JOIN,
      automationActive: dto.automationActive ?? true,
      recipients: [],
      totalRecipients: 0,
      trackOpens: true,
      trackClicks: true,
      metadata: { communityName: community.name, automationTemplateType: 'WELCOME' },
    });

    const saved = await template.save();
    this.logger.log(`Created welcome template ${saved._id.toString()} for community ${communityId}`);
    return saved;
  }

  async getWelcomeTemplate(
    creatorId: string,
    communityId: string,
  ): Promise<EmailCampaignDocument | null> {
    await this.verifyCommunityAccess(creatorId, communityId);
    return this.emailCampaignModel
      .findOne({
        communityId: new Types.ObjectId(communityId),
        isAutomationTemplate: true,
        eventTrigger: AutomationEventTrigger.COMMUNITY_JOIN,
        automationActive: true,
      })
      .exec();
  }

  async updateWelcomeTemplate(
    creatorId: string,
    communityId: string,
    dto: UpdateWelcomeTemplateDto,
  ): Promise<EmailCampaignDocument> {
    await this.verifyCommunityAccess(creatorId, communityId);

    const template = await this.emailCampaignModel
      .findOne({
        communityId: new Types.ObjectId(communityId),
        isAutomationTemplate: true,
        eventTrigger: AutomationEventTrigger.COMMUNITY_JOIN,
      })
      .exec();

    if (!template) {
      throw new NotFoundException('Welcome template not found. Create one first.');
    }

    if (dto.isHtml !== undefined) template.isHtml = dto.isHtml;
    if (dto.subject !== undefined) template.subject = dto.subject;
    if (dto.content !== undefined) {
      template.content = this.sanitizeCampaignContent(dto.content, template.isHtml);
    } else if (dto.isHtml === true) {
      template.content = this.sanitizeCampaignContent(template.content, true);
    }

    return template.save();
  }

  async deleteWelcomeTemplate(creatorId: string, communityId: string): Promise<void> {
    await this.verifyCommunityAccess(creatorId, communityId);
    const result = await this.emailCampaignModel
      .deleteOne({
        communityId: new Types.ObjectId(communityId),
        isAutomationTemplate: true,
        eventTrigger: AutomationEventTrigger.COMMUNITY_JOIN,
      })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Welcome template not found');
    }
  }

  async toggleWelcomeTemplate(creatorId: string, communityId: string, active: boolean): Promise<EmailCampaignDocument> {
    await this.verifyCommunityAccess(creatorId, communityId);

    const template = await this.emailCampaignModel
      .findOne({
        communityId: new Types.ObjectId(communityId),
        isAutomationTemplate: true,
        eventTrigger: AutomationEventTrigger.COMMUNITY_JOIN,
      })
      .exec();

    if (!template) {
      throw new NotFoundException('Welcome template not found. Create one first.');
    }

    template.automationActive = active;
    return template.save();
  }

  /**
   * Called by the community-join service whenever a user successfully joins a community.
   * Finds the community's active welcome template and sends it immediately.
   */
  async sendWelcomeEmailToNewMember(userId: string, communityId: string): Promise<void> {    try {
      const template = await this.emailCampaignModel
        .findOne({
          communityId: new Types.ObjectId(communityId),
          isAutomationTemplate: true,
          eventTrigger: AutomationEventTrigger.COMMUNITY_JOIN,
          automationActive: true,
        })
        .lean()
        .exec();

      if (!template) return; // no welcome email configured

      const user = await this.userModel.findById(userId).select('_id email name username pays ville createdAt').lean().exec();
      if (!user?.email) return;

      const community = await this.communityModel
        .findById(communityId)
        .select('name slug category members currency price pricing settings fees_of_join inviteLink createur')
        .lean()
        .exec();
      const communityName = community?.name || '';

      const variables = await this.buildMarketingPreviewVariables(String(template.creatorId || ''), community || {}, {
        sampleUserId: userId,
        metadata: this.buildUserMarketingData(user),
      });

      const renderedSubject = renderTemplate(template.subject, variables);
      const renderedContent = this.sanitizeCampaignContent(
        renderTemplate(template.content, variables),
        template.isHtml,
      );

      await this.sendCampaignMessage({
        to: user.email,
        subject: renderedSubject,
        text: template.isHtml ? '' : renderedContent,
        html: template.isHtml ? renderedContent : undefined,
        communityName,
      });

      // Track this delivery by adding the recipient to the template document
      await this.emailCampaignModel
        .updateOne(
          { _id: template._id },
          {
            $push: {
              recipients: {
                userId: new Types.ObjectId(userId),
                email: user.email,
                name: user.name || user.email,
                status: 'sent',
                sentAt: new Date(),
                opened: false,
                clickCount: 0,
                mergeData: this.buildUserMarketingData(user),
              },
            },
            $inc: { sentCount: 1, totalRecipients: 1 },
          },
        )
        .exec();

      this.logger.log(`Welcome email sent to ${user.email} for community ${communityId}`);
    } catch (err: any) {
      // Never throw — welcome email failure must not break the join flow
      this.logger.error(`Failed to send welcome email to user ${userId}: ${err?.message || err}`);
    }
  }

  // ─── Daily Inactivity Automation ────────────────────────────────────────────

  /**
   * Creates a continuous inactivity automation — a "set-and-forget" campaign that
   * automatically sends the provided email to any member who has been inactive for
   * exactly `minInactiveDays` days (checked daily at 08:00 server time).
   * The system prevents re-sending to the same user within 30 days.
   */
  async createInactivityAutomation(
    creatorId: string,
    dto: {
      communityId: string;
      title: string;
      subject: string;
      content: string;
      minInactiveDays: number;
      isHtml?: boolean;
    },
  ): Promise<EmailCampaignDocument> {
    const community = await this.verifyCommunityAccess(creatorId, dto.communityId);

    if (dto.minInactiveDays < 1) {
      throw new BadRequestException('minInactiveDays must be at least 1');
    }

    // Deactivate existing automation for the same threshold in this community
    await this.emailCampaignModel
      .updateMany(
        {
          communityId: new Types.ObjectId(dto.communityId),
          isInactiveUserCampaign: true,
          'metadata.automationSource': 'daily_inactivity',
          'metadata.minInactiveDays': dto.minInactiveDays,
        },
        { $set: { 'metadata.automationActive': false } },
      )
      .exec();

    const automation = new this.emailCampaignModel({
      title: dto.title,
      subject: dto.subject,
      content: this.sanitizeCampaignContent(dto.content, dto.isHtml),
      communityId: new Types.ObjectId(dto.communityId),
      creatorId: new Types.ObjectId(creatorId),
      type: EmailCampaignType.INACTIVE_USER_REACTIVATION,
      status: EmailCampaignStatus.DRAFT, // never enters the send queue — cron handles it
      isHtml: dto.isHtml ?? false,
      isInactiveUserCampaign: true,
      targetDaysThreshold: dto.minInactiveDays,
      recipients: [],
      totalRecipients: 0,
      sentCount: 0,
      trackOpens: true,
      trackClicks: true,
      metadata: {
        communityName: community.name,
        automationSource: 'daily_inactivity',
        automationActive: true,
        minInactiveDays: dto.minInactiveDays,
      },
    });

    const saved = await automation.save();
    this.logger.log(
      `Created inactivity automation ${saved._id.toString()} for community ${dto.communityId} — triggers at ${dto.minInactiveDays}d inactive`,
    );
    return saved;
  }

  async toggleInactivityAutomation(automationId: string, creatorId: string, active: boolean): Promise<EmailCampaignDocument> {
    const automation = await this.emailCampaignModel.findById(automationId).exec();
    if (!automation) throw new NotFoundException('Inactivity automation not found');
    if (!automation.creatorId.equals(creatorId)) throw new ForbiddenException('Not your automation');
    if (automation.metadata?.automationSource !== 'daily_inactivity') {
      throw new BadRequestException('Not an inactivity automation');
    }
    automation.metadata = { ...automation.metadata, automationActive: active };
    return automation.save();
  }

  async getInactivityAutomations(creatorId: string, communityId: string): Promise<EmailCampaignDocument[]> {
    await this.verifyCommunityAccess(creatorId, communityId);
    return this.emailCampaignModel
      .find({
        communityId: new Types.ObjectId(communityId),
        isInactiveUserCampaign: true,
        'metadata.automationSource': 'daily_inactivity',
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Called once per day by the cron processor.
   * Finds all communities where the creator has stored an automated inactivity
   * campaign template (identified by metadata.automationSource === 'daily_inactivity'),
   * resolves newly-qualifying inactive users that have NOT already been sent this
   * email in the last 30 days, and sends them the email immediately.
   */
  async runDailyInactivityAutomations(): Promise<void> {    // Find all automation-enabled inactivity campaigns across all communities
    const automations = await this.emailCampaignModel
      .find({
        isInactiveUserCampaign: true,
        'metadata.automationSource': 'daily_inactivity',
        'metadata.automationActive': true,
      })
      .lean()
      .exec();

    this.logger.log(`Found ${automations.length} daily inactivity automation(s) to process`);

    for (const automation of automations) {
      try {
        const minInactiveDays = automation.metadata?.minInactiveDays as number;
        if (!minInactiveDays || minInactiveDays < 1) continue;

        const cutoff = new Date(Date.now() - minInactiveDays * 24 * 60 * 60 * 1000);
        const recentEmailCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const communityId = automation.communityId;

        // Get inactive users that crossed the threshold today (within a 24-hour window)
        const yesterdayCutoff = new Date(cutoff.getTime() - 24 * 60 * 60 * 1000);

        const activities = await this.userLoginActivityModel
          .find({
            communityId,
            lastLoginAt: { $gte: yesterdayCutoff, $lt: cutoff },
          })
          .populate('userId', '_id email name username pays ville createdAt')
          .lean()
          .exec();

        const community = await this.communityModel
          .findById(communityId)
          .select('name slug category members currency price pricing settings fees_of_join inviteLink createur')
          .lean()
          .exec();
        const communityName = community?.name || '';

        for (const activity of activities) {
          const user = activity.userId as any;
          if (!user?.email) continue;

          // Skip if we've emailed this user from THIS automation within the last 30 days
          const alreadySent = automation.recipients?.some(
            (r: any) =>
              String(r.userId) === String(user._id) &&
              r.sentAt &&
              new Date(r.sentAt) > recentEmailCutoff,
          );
          if (alreadySent) continue;

          const variables = await this.buildMarketingPreviewVariables(String(automation.creatorId || ''), community || {}, {
            sampleUserId: String(user._id),
            metadata: {
              ...this.buildUserMarketingData(user),
              ...this.buildActivityMarketingData(activity, undefined),
              daysThreshold: minInactiveDays,
              daysSinceLastLogin: minInactiveDays,
            },
          });

          const renderedSubject = renderTemplate(automation.subject, variables);
          const renderedContent = renderTemplate(automation.content, variables);

          try {
            await this.sendCampaignMessage({
              to: user.email,
              subject: renderedSubject,
              text: automation.isHtml ? '' : renderedContent,
              html: automation.isHtml ? renderedContent : undefined,
              communityName,
            });

            // Record delivery
            await this.emailCampaignModel
              .updateOne(
                { _id: automation._id },
                {
                  $push: {
                    recipients: {
                      userId: user._id,
                      email: user.email,
                      name: user.name || user.email,
                      status: 'sent',
                      sentAt: new Date(),
                      opened: false,
                      clickCount: 0,
                      mergeData: {
                        ...this.buildUserMarketingData(user),
                        ...this.buildActivityMarketingData(activity, undefined),
                        daysThreshold: minInactiveDays,
                        daysSinceLastLogin: minInactiveDays,
                      },
                    },
                  },
                  $inc: { sentCount: 1, totalRecipients: 1 },
                },
              )
              .exec();

            this.logger.debug(`Inactivity automation email sent to ${user.email} (inactive ${minInactiveDays}d)`);
          } catch (sendErr: any) {
            this.logger.warn(`Failed to send inactivity automation to ${user.email}: ${sendErr?.message}`);
          }
        }
      } catch (automationErr: any) {
        this.logger.error(`Error in daily inactivity automation ${String(automation._id)}: ${automationErr?.message}`);
      }
    }
  }

  async sendCampaign(
    campaignId: string,
    creatorId: string,
  ): Promise<{ queued: true; campaignId: string; message: string }> {
    const campaign = await this.emailCampaignModel.findById(campaignId).exec();
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    if (!campaign.creatorId.equals(creatorId)) {
      throw new ForbiddenException('You can only send campaigns you created');
    }
    const hasFailedRecipients = campaign.recipients.some((recipient) => recipient.status === 'failed');
    const canRetryFailedCampaign =
      campaign.status === EmailCampaignStatus.FAILED ||
      (campaign.status === EmailCampaignStatus.SENT && hasFailedRecipients);

    if (campaign.status === EmailCampaignStatus.SENDING) {
      return {
        queued: true,
        campaignId,
        message: 'Campaign is already being sent',
      };
    }

    if (campaign.status === EmailCampaignStatus.SENT && !hasFailedRecipients) {
      return {
        queued: true,
        campaignId,
        message: 'Campaign has already been sent successfully',
      };
    }

    if (
      campaign.status !== EmailCampaignStatus.DRAFT &&
      campaign.status !== EmailCampaignStatus.SCHEDULED &&
      !canRetryFailedCampaign
    ) {
      throw new BadRequestException('Campaign cannot be sent in current status');
    }

    if (canRetryFailedCampaign) {
      campaign.recipients.forEach((recipient) => {
        if (recipient.status === 'failed') {
          recipient.status = 'pending';
          recipient.errorMessage = undefined;
          recipient.sentAt = undefined;
        }
      });
      campaign.failedCount = 0;
    }

    campaign.metadata = {
      ...(campaign.metadata || {}),
      queueError: undefined,
      queueFailedAt: undefined,
    };
    campaign.status = EmailCampaignStatus.DRAFT;
    campaign.scheduledAt = undefined;
    campaign.sentAt = undefined;
    await campaign.save();

    await this.emailCampaignQueueService.queueCampaignSend({
      campaignId,
      requestedBy: creatorId,
      trigger: 'manual',
    });

    return {
      queued: true,
      campaignId,
      message: 'Campaign queued for sending',
    };
  }

  async executeSendCampaignJob(payload: EmailCampaignSendJobPayload): Promise<void> {
    const { campaignId } = payload;
    const campaign = await this.emailCampaignModel.findById(campaignId).exec();

    if (!campaign) {
      this.logger.warn(`Skipping send job for missing campaign ${campaignId}`);
      return;
    }

    if (campaign.status === EmailCampaignStatus.CANCELLED || campaign.status === EmailCampaignStatus.SENT) {
      this.logger.log(`Skipping campaign ${campaignId} with status ${campaign.status}`);
      return;
    }
    if (
      campaign.status !== EmailCampaignStatus.DRAFT &&
      campaign.status !== EmailCampaignStatus.SCHEDULED &&
      campaign.status !== EmailCampaignStatus.SENDING
    ) {
      this.logger.warn(`Campaign ${campaignId} has unsupported status ${campaign.status}`);
      return;
    }

    const community = await this.communityModel
      .findById(campaign.communityId)
      .select('name slug category members currency price pricing settings fees_of_join inviteLink createur')
      .lean()
      .exec();

    if (campaign.status !== EmailCampaignStatus.SENDING) {
      campaign.status = EmailCampaignStatus.SENDING;
      await this.emailCampaignModel
        .updateOne({ _id: campaign._id }, { $set: { status: EmailCampaignStatus.SENDING } })
        .exec();
    } else {
      this.logger.warn(`Resuming campaign ${campaignId} that was already in sending state`);
    }

    const recipientsToProcess = campaign.recipients.filter((recipient) => recipient.status !== 'sent');
    if (recipientsToProcess.length === 0) {
      campaign.sentCount = campaign.recipients.filter((recipient) => recipient.status === 'sent').length;
      campaign.failedCount = campaign.recipients.filter((recipient) => recipient.status === 'failed').length;
      campaign.status = campaign.failedCount > 0 ? EmailCampaignStatus.FAILED : EmailCampaignStatus.SENT;
      campaign.sentAt = new Date();
      await this.persistCampaignSendState(campaign);
      return;
    }

    const batchSize = 10;
    const batches = this.chunkArray(recipientsToProcess, batchSize);
    let authenticationFailureMessage: string | null = null;

    for (let index = 0; index < batches.length; index += 1) {
      const batch = batches[index];
      const results = await Promise.all(
        batch.map((recipient) => this.sendEmailToRecipient(campaign, recipient, community || {})),
      );
      const authFailureInBatch = results.some((result) => result.authenticationFailure);
      if (authFailureInBatch) {
        authenticationFailureMessage =
          campaign.recipients.find((recipient) => recipient.status === 'failed')?.errorMessage ||
          'SMTP authentication failed';
        break;
      }

      if (index < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (authenticationFailureMessage) {
      const failureMessage = authenticationFailureMessage;
      campaign.recipients
        .filter((recipient) => recipient.status === 'pending')
        .forEach((recipient) => {
          recipient.status = 'failed';
          recipient.errorMessage = failureMessage;
        });
      this.logger.error(
        `Campaign ${campaign._id.toString()} aborted due to SMTP auth failure: ${authenticationFailureMessage}`,
      );
    }

    campaign.sentCount = campaign.recipients.filter((recipient) => recipient.status === 'sent').length;
    campaign.failedCount = campaign.recipients.filter((recipient) => recipient.status === 'failed').length;
    campaign.sentAt = new Date();
    campaign.status =
      campaign.sentCount > 0 ? EmailCampaignStatus.SENT : EmailCampaignStatus.FAILED;
    await this.persistCampaignSendState(campaign);

    if (campaign.isInactiveUserCampaign) {
      await this.updateReactivationEmailTracking(campaign);
    }
  }

  async markCampaignSendFailed(campaignId: string, errorMessage: string): Promise<void> {
    await this.emailCampaignModel
      .updateOne(
        {
          _id: campaignId,
          status: { $nin: [EmailCampaignStatus.SENT, EmailCampaignStatus.CANCELLED] },
        },
        {
          $set: {
            status: EmailCampaignStatus.FAILED,
            'metadata.queueError': errorMessage,
            'metadata.queueFailedAt': new Date().toISOString(),
            sentAt: new Date(),
          },
        },
      )
      .exec();
  }

  async getCommunityCampaigns(
    creatorId: string,
    communityId: string,
    query: EmailCampaignQueryDto,
  ): Promise<{ campaigns: EmailCampaignDocument[]; total: number; page: number; limit: number }> {
    await this.verifyCommunityAccess(creatorId, communityId);

    const filter: Record<string, any> = {
      communityId: new Types.ObjectId(communityId),
    };

    if (query.status) filter.status = query.status;
    if (query.type) filter.type = query.type;
    if (query.inactiveUserCampaigns !== undefined) {
      filter.isInactiveUserCampaign = query.inactiveUserCampaigns;
    }
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { subject: { $regex: query.search, $options: 'i' } },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      this.emailCampaignModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('creatorId', 'name email')
        .exec(),
      this.emailCampaignModel.countDocuments(filter).exec(),
    ]);

    return { campaigns, total, page, limit };
  }

  async getCampaignStats(creatorId: string, communityId: string): Promise<CampaignStatsDto> {
    await this.verifyCommunityAccess(creatorId, communityId);

    const campaigns = await this.emailCampaignModel
      .find({ communityId: new Types.ObjectId(communityId) })
      .lean()
      .exec();

    const totalCampaigns = campaigns.length;
    const totalEmailsSent = campaigns.reduce((sum, campaign) => sum + (campaign.sentCount || 0), 0);
    const totalEmailsFailed = campaigns.reduce((sum, campaign) => sum + (campaign.failedCount || 0), 0);
    const totalOpens = campaigns.reduce((sum, campaign) => sum + (campaign.openCount || 0), 0);
    const totalClicks = campaigns.reduce((sum, campaign) => sum + (campaign.clickCount || 0), 0);
    const totalUniqueClicks = campaigns.reduce(
      (sum, campaign) =>
        sum + (Array.isArray(campaign.recipients) ? campaign.recipients.filter((recipient) => (recipient?.clickCount || 0) > 0).length : 0),
      0,
    );

    const reactivationCampaigns = campaigns.filter((campaign) => campaign.isInactiveUserCampaign).length;
    const reactivationSent = campaigns
      .filter((campaign) => campaign.isInactiveUserCampaign)
      .reduce((sum, campaign) => sum + (campaign.sentCount || 0), 0);
    const reactivationOpens = campaigns
      .filter((campaign) => campaign.isInactiveUserCampaign)
      .reduce((sum, campaign) => sum + (campaign.openCount || 0), 0);

    return {
      totalCampaigns,
      totalEmailsSent,
      totalEmailsFailed,
      totalOpens,
      totalClicks,
      averageOpenRate: totalEmailsSent > 0 ? (totalOpens / totalEmailsSent) * 100 : 0,
      averageClickRate: totalEmailsSent > 0 ? (totalUniqueClicks / totalEmailsSent) * 100 : 0,
      reactivationCampaigns,
      reactivationSuccessRate: reactivationSent > 0 ? (reactivationOpens / reactivationSent) * 100 : 0,
    };
  }

  async getInactiveUsers(
    creatorId: string,
    communityId: string,
    query: InactiveUserQueryDto,
  ): Promise<UserLoginActivityDocument[]> {
    await this.verifyCommunityAccess(creatorId, communityId);
    const limit = query.limit || 100;
    if (query.period) {
      return this.userLoginActivityService.getInactiveUsersByPeriod(communityId, query.period, limit);
    }
    return this.userLoginActivityService.getAllInactiveUsers(communityId, limit);
  }

  async getInactiveUserStats(creatorId: string, communityId: string): Promise<InactiveUserStatsDto> {
    await this.verifyCommunityAccess(creatorId, communityId);
    return this.userLoginActivityService.getInactivityStats(communityId);
  }

  async getCampaign(campaignId: string, creatorId: string): Promise<EmailCampaignDocument> {
    const campaign = await this.emailCampaignModel
      .findById(campaignId)
      .populate('creatorId', 'name email')
      .exec();

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    await this.verifyCommunityAccess(creatorId, campaign.communityId.toString());
    return campaign;
  }

  async updateCampaign(
    campaignId: string,
    dto: UpdateEmailCampaignDto,
    creatorId: string,
  ): Promise<EmailCampaignDocument> {
    const campaign = await this.emailCampaignModel.findById(campaignId).exec();
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    if (!campaign.creatorId.equals(creatorId)) {
      throw new ForbiddenException('You can only update campaigns you created');
    }
    if (
      campaign.status !== EmailCampaignStatus.DRAFT &&
      campaign.status !== EmailCampaignStatus.SCHEDULED
    ) {
      throw new BadRequestException('Campaign cannot be updated in current status');
    }

    if (dto.title !== undefined) campaign.title = dto.title;
    if (dto.subject !== undefined) campaign.subject = dto.subject;
    if (dto.isHtml !== undefined) campaign.isHtml = dto.isHtml;
    if (dto.content !== undefined) {
      campaign.content = this.sanitizeCampaignContent(dto.content, campaign.isHtml);
    } else if (dto.isHtml === true) {
      campaign.content = this.sanitizeCampaignContent(campaign.content, true);
    }
    if (dto.trackOpens !== undefined) campaign.trackOpens = dto.trackOpens;
    if (dto.trackClicks !== undefined) campaign.trackClicks = dto.trackClicks;
    if (dto.metadata !== undefined) campaign.metadata = dto.metadata;
    if (dto.templateData !== undefined) campaign.templateData = dto.templateData;

    if (dto.scheduledAt !== undefined) {
      campaign.scheduledAt = this.normalizeScheduledAt(dto.scheduledAt);
      campaign.status = this.resolveCampaignStatus(campaign.scheduledAt);
    } else if (dto.status === EmailCampaignStatus.DRAFT) {
      campaign.status = EmailCampaignStatus.DRAFT;
      campaign.scheduledAt = undefined;
    } else if (dto.status === EmailCampaignStatus.SCHEDULED) {
      if (!campaign.scheduledAt) {
        throw new BadRequestException('scheduledAt is required when setting status to scheduled');
      }
      campaign.status = EmailCampaignStatus.SCHEDULED;
    }

    const updatedCampaign = await campaign.save();

    if (updatedCampaign.status === EmailCampaignStatus.SCHEDULED && updatedCampaign.scheduledAt) {
      await this.emailCampaignQueueService.queueCampaignSend(
        {
          campaignId: updatedCampaign._id.toString(),
          requestedBy: creatorId,
          trigger: 'scheduled',
        },
        updatedCampaign.scheduledAt,
      );
    } else {
      await this.emailCampaignQueueService.removeScheduledCampaignSend(updatedCampaign._id.toString());
    }

    await updatedCampaign.populate('creatorId', 'name email');
    return updatedCampaign;
  }

  async deleteCampaign(campaignId: string, creatorId: string): Promise<void> {
    const campaign = await this.emailCampaignModel.findById(campaignId).exec();
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    if (!campaign.creatorId.equals(creatorId)) {
      throw new ForbiddenException('You can only delete campaigns you created');
    }
    if (
      campaign.status !== EmailCampaignStatus.DRAFT &&
      campaign.status !== EmailCampaignStatus.SCHEDULED
    ) {
      throw new BadRequestException('Campaign cannot be deleted in current status');
    }

    await this.emailCampaignQueueService.removeScheduledCampaignSend(campaignId);
    await this.emailCampaignModel.deleteOne({ _id: campaignId }).exec();
  }

  async cancelCampaign(campaignId: string, creatorId: string): Promise<void> {
    const campaign = await this.emailCampaignModel.findById(campaignId).exec();
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    if (!campaign.creatorId.equals(creatorId)) {
      throw new ForbiddenException('You can only cancel campaigns you created');
    }
    if (campaign.status !== EmailCampaignStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled campaigns can be cancelled');
    }

    campaign.status = EmailCampaignStatus.CANCELLED;
    await campaign.save();
    await this.emailCampaignQueueService.removeScheduledCampaignSend(campaignId);
  }

  async duplicateCampaign(
    campaignId: string,
    creatorId: string,
    newTitle?: string,
  ): Promise<EmailCampaignDocument> {
    const source = await this.emailCampaignModel.findById(campaignId).exec();
    if (!source) {
      throw new NotFoundException('Campaign not found');
    }
    await this.verifyCommunityAccess(creatorId, source.communityId.toString());

    const community = await this.communityModel.findById(source.communityId).exec();
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    const recipients = await this.buildCommunityRecipients(community);

    const duplicate = new this.emailCampaignModel({
      title: newTitle || `Copy of ${source.title}`,
      subject: source.subject,
      content: source.content,
      communityId: source.communityId,
      creatorId: new Types.ObjectId(creatorId),
      recipients,
      totalRecipients: recipients.length,
      type: source.type,
      isHtml: source.isHtml,
      trackOpens: source.trackOpens,
      trackClicks: source.trackClicks,
      metadata: source.metadata || {},
      status: EmailCampaignStatus.DRAFT,
    });

    return duplicate.save();
  }

  async getCampaignRecipients(
    campaignId: string,
    creatorId: string,
    query: RecipientsQuery,
  ): Promise<{ recipients: any[]; total: number; page: number; limit: number }> {
    const campaign = await this.getCampaign(campaignId, creatorId);

    let recipients = campaign.recipients.slice();
    if (query.status) recipients = recipients.filter((recipient) => recipient.status === query.status);
    if (query.opened !== undefined) recipients = recipients.filter((recipient) => recipient.opened === query.opened);

    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100);
    const start = (page - 1) * limit;
    const paged = recipients.slice(start, start + limit).map((recipient) => ({
      userId: recipient.userId,
      email: recipient.email,
      name: recipient.name,
      status: recipient.status,
      sentAt: recipient.sentAt,
      opened: recipient.opened,
      openedAt: recipient.openedAt,
      clickCount: recipient.clickCount,
      clickedAt: recipient.clickedAt,
      errorMessage: recipient.errorMessage,
      personalizedSubject: recipient.personalizedSubject,
      personalizedContent: recipient.personalizedContent,
      mergeData: recipient.mergeData || {},
    }));

    return {
      recipients: paged,
      total: recipients.length,
      page,
      limit,
    };
  }

  async sendTestEmail(
    creatorId: string,
    toEmail: string,
    subject: string,
    content: string,
    communityId?: string,
    isHtml = false,
  ): Promise<void> {
    let variables: Record<string, any> = {
      ...this.buildDateMarketingData(),
      ...this.buildUserMarketingData({ name: 'Test User', email: toEmail, username: 'test-user' }),
    };
    let communityName = '';
    if (communityId && Types.ObjectId.isValid(communityId)) {
      const community = await this.verifyCommunityAccess(creatorId, communityId);
      communityName = community?.name || '';
      variables = await this.buildMarketingPreviewVariables(creatorId, community, {
        sampleUserId: undefined,
        metadata: variables,
      });
    }

    const processedSubject = renderTemplate(subject, variables);
    const processedContent = renderTemplate(content, variables);

    await this.sendCampaignMessage({
      to: toEmail,
      subject: processedSubject,
      text: isHtml ? '' : processedContent,
      html: isHtml ? processedContent : undefined,
      communityName,
    });
  }

  async recordOpenByToken(token?: string): Promise<boolean> {
    const payload = this.parseTrackingToken(token, 'open');
    if (!payload) return false;

    const recipientObjectId = this.parseRecipientObjectId(payload.recipientUserId);
    if (!recipientObjectId) return false;

    const now = new Date();
    await this.emailCampaignModel
      .updateOne(
        {
          _id: payload.campaignId,
          trackOpens: { $ne: false },
          recipients: {
            $elemMatch: {
              userId: recipientObjectId,
              email: payload.recipientEmail,
              opened: false,
            },
          },
        },
        {
          $set: {
            'recipients.$.opened': true,
            'recipients.$.openedAt': now,
          },
          $inc: {
            openCount: 1,
          },
        },
      )
      .exec();

    const recipientExists = await this.emailCampaignModel
      .exists({
        _id: payload.campaignId,
        trackOpens: { $ne: false },
        recipients: {
          $elemMatch: {
            userId: recipientObjectId,
            email: payload.recipientEmail,
          },
        },
      })
      .exec();

    return Boolean(recipientExists);
  }

  async recordClickByToken(token?: string): Promise<string> {
    const fallbackUrl = this.getInvalidClickRedirectUrl();
    const payload = this.parseTrackingToken(token, 'click');
    if (!payload || !payload.url) return fallbackUrl;

    const recipientObjectId = this.parseRecipientObjectId(payload.recipientUserId);
    if (!recipientObjectId) return fallbackUrl;

    const now = new Date();
    await this.emailCampaignModel
      .updateOne(
        {
          _id: payload.campaignId,
          trackClicks: { $ne: false },
          recipients: {
            $elemMatch: {
              userId: recipientObjectId,
              email: payload.recipientEmail,
            },
          },
        },
        {
          $inc: {
            'recipients.$.clickCount': 1,
            clickCount: 1,
          },
          $push: {
            'recipients.$.clickedAt': now,
          },
        },
      )
      .exec();

    // A click implies an open if open tracking is enabled.
    await this.emailCampaignModel
      .updateOne(
        {
          _id: payload.campaignId,
          trackOpens: { $ne: false },
          recipients: {
            $elemMatch: {
              userId: recipientObjectId,
              email: payload.recipientEmail,
              opened: false,
            },
          },
        },
        {
          $set: {
            'recipients.$.opened': true,
            'recipients.$.openedAt': now,
          },
          $inc: {
            openCount: 1,
          },
        },
      )
      .exec();

    return payload.url;
  }

  getOpenTrackingPixel(): Buffer {
    return TRANSPARENT_GIF_BUFFER;
  }

  private async verifyCommunityAccess(creatorId: string, communityId: string): Promise<CommunityDocument> {
    const community = await this.communityModel
      .findOne({
        _id: new Types.ObjectId(communityId),
        $or: [
          { createur: new Types.ObjectId(creatorId) },
          { admins: new Types.ObjectId(creatorId) },
        ],
      })
      .exec();

    if (!community) {
      throw new ForbiddenException('You can only manage campaigns for communities you own or admin');
    }
    return community;
  }

  private async buildCommunityRecipients(community: CommunityDocument): Promise<EmailRecipient[]> {
    const members = await this.userModel
      .find({ _id: { $in: community.members } })
      .select('_id email name username pays ville createdAt profile_picture photo_profil')
      .lean()
      .exec();

    return members.map((member) => ({
      userId: member._id as any,
      email: member.email,
      name: member.name,
      status: 'pending',
      opened: false,
      clickCount: 0,
      mergeData: this.buildUserMarketingData(member),
    }));
  }

  private async getInactiveUsersForCampaign(
    dto: CreateInactiveUserCampaignDto,
  ): Promise<UserLoginActivityDocument[]> {
    const limit = dto.maxRecipients || 1000;
    if (dto.targetAllInactive) {
      return this.userLoginActivityService.getAllInactiveUsers(dto.communityId, limit);
    }
    return this.userLoginActivityService.getInactiveUsersByPeriod(
      dto.communityId,
      dto.inactivityPeriod,
      limit,
    );
  }

  private normalizeScheduledAt(raw?: string): Date | undefined {
    if (!raw) return undefined;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid scheduledAt value');
    }
    return parsed.getTime() > Date.now() ? parsed : undefined;
  }

  private resolveCampaignStatus(scheduledAt?: Date): EmailCampaignStatus {
    return scheduledAt ? EmailCampaignStatus.SCHEDULED : EmailCampaignStatus.DRAFT;
  }

  private async enqueueIfScheduled(
    campaign: EmailCampaignDocument,
    creatorId: string,
    trigger: EmailCampaignSendJobPayload['trigger'],
  ): Promise<void> {
    if (campaign.status !== EmailCampaignStatus.SCHEDULED || !campaign.scheduledAt) return;
    await this.emailCampaignQueueService.queueCampaignSend(
      {
        campaignId: campaign._id.toString(),
        requestedBy: creatorId,
        trigger,
      },
      campaign.scheduledAt,
    );
  }

  private async sendEmailToRecipient(
    campaign: EmailCampaignDocument,
    recipient: EmailRecipient,
    community: any,
  ): Promise<SendRecipientResult> {
    const communityName = community?.name || '';
    const userSnapshot = await this.findUserSnapshot(recipient.userId?.toString());
    const activity = await this.findUserActivitySnapshot(
      recipient.userId?.toString(),
      campaign.communityId?.toString(),
    );
    const baseVariables = this.buildBaseVariables({
      recipientName: recipient.name,
      communityName,
      targetDaysThreshold: campaign.targetDaysThreshold,
      targetInactivityPeriod: campaign.targetInactivityPeriod,
      contentType: String(campaign.metadata?.contentType || ''),
    });
    const variables = this.normalizeMarketingVariables({
      ...baseVariables,
      ...this.buildDateMarketingData(),
      ...this.buildCommunityMarketingData(community, null),
      ...this.buildUserMarketingData(userSnapshot || recipient),
      ...this.buildActivityMarketingData(activity, campaign.targetInactivityPeriod),
      ...(campaign.templateData || {}),
      ...(campaign.metadata || {}),
      ...(recipient.mergeData || {}),
      campaignTitle: campaign.title,
      campaignType: campaign.type,
    });

    const subject = renderTemplate(campaign.subject, variables);
    const content = this.sanitizeCampaignContent(renderTemplate(campaign.content, variables), campaign.isHtml);
    const trackedContent = this.buildTrackedRecipientContent(campaign, recipient, content);

    try {
      await this.sendCampaignMessage({
        to: recipient.email,
        subject,
        text: trackedContent.text,
        html: trackedContent.html,
        communityName,
      });

      recipient.status = 'sent';
      recipient.sentAt = new Date();
      recipient.errorMessage = undefined;
      recipient.personalizedSubject = subject;
      recipient.personalizedContent = content;
      return { authenticationFailure: false };
    } catch (error) {
      recipient.status = 'failed';
      recipient.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      recipient.personalizedSubject = subject;
      recipient.personalizedContent = content;
      this.logger.error(
        `Failed sending campaign ${campaign._id.toString()} to ${recipient.email}: ${recipient.errorMessage}`,
      );
      return {
        authenticationFailure: this.emailService.isAuthenticationFailureError(error),
      };
    }
  }

  private async sendCampaignMessage(payload: {
    to: string;
    subject: string;
    text: string;
    html?: string;
    communityName?: string;
  }): Promise<void> {
    const campaignSender = (this.emailService as any).sendCampaignEmail;
    if (typeof campaignSender === 'function') {
      await campaignSender.call(this.emailService, payload);
      return;
    }

    await this.emailService.sendGenericEmail({
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
  }

  private buildTrackedRecipientContent(
    campaign: EmailCampaignDocument,
    recipient: EmailRecipient,
    content: string,
  ): { text: string; html?: string } {
    const trackClicks = campaign.trackClicks !== false;
    const trackOpens = campaign.trackOpens !== false;

    if (campaign.isHtml) {
      let trackedHtml = content;
      if (trackClicks) {
        trackedHtml = this.rewriteHtmlLinksWithTracking(trackedHtml, campaign, recipient);
      }
      if (trackOpens) {
        const openTrackingUrl = this.buildOpenTrackingUrl(campaign, recipient);
        trackedHtml = this.injectOpenTrackingPixel(trackedHtml, openTrackingUrl);
      }
      return { text: '', html: trackedHtml };
    }

    const trackedText = trackClicks
      ? this.rewritePlainTextLinksWithTracking(content, campaign, recipient)
      : content;

    let trackedHtml = this.renderPlainTextAsHtml(trackedText);
    if (trackOpens) {
      const openTrackingUrl = this.buildOpenTrackingUrl(campaign, recipient);
      trackedHtml = this.injectOpenTrackingPixel(trackedHtml, openTrackingUrl);
    }

    return { text: trackedText, html: trackedHtml };
  }

  private rewriteHtmlLinksWithTracking(
    html: string,
    campaign: EmailCampaignDocument,
    recipient: EmailRecipient,
  ): string {
    return html.replace(/href=(["'])(https?:\/\/[^"'<>\s]+)\1/gi, (match, quote, rawUrl) => {
      const destination = this.normalizeTrackingDestination(rawUrl);
      if (!destination) return match;
      const trackedUrl = this.buildClickTrackingUrl(campaign, recipient, destination);
      return `href=${quote}${trackedUrl}${quote}`;
    });
  }

  private rewritePlainTextLinksWithTracking(
    text: string,
    campaign: EmailCampaignDocument,
    recipient: EmailRecipient,
  ): string {
    return text.replace(/https?:\/\/[^\s<>"')\]]+/gi, (rawUrl) => {
      const trimmedUrl = rawUrl.replace(/[.,!?;:]+$/, '');
      const suffix = rawUrl.slice(trimmedUrl.length);
      const destination = this.normalizeTrackingDestination(trimmedUrl);
      if (!destination) return rawUrl;
      const trackedUrl = this.buildClickTrackingUrl(campaign, recipient, destination);
      return `${trackedUrl}${suffix}`;
    });
  }

  private injectOpenTrackingPixel(html: string, openTrackingUrl: string): string {
    const pixelTag =
      `<img src="${openTrackingUrl}" alt="" width="1" height="1" ` +
      `style="display:none;max-width:0;max-height:0;opacity:0;overflow:hidden;" />`;
    if (/<\/body>/i.test(html)) {
      return html.replace(/<\/body>/i, `${pixelTag}</body>`);
    }
    return `${html}${pixelTag}`;
  }

  private renderPlainTextAsHtml(content: string): string {
    return `<p style="margin:0;">${this.escapeHtml(content).replace(/\n/g, '<br/>')}</p>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private buildOpenTrackingUrl(campaign: EmailCampaignDocument, recipient: EmailRecipient): string {
    const token = this.signTrackingPayload({
      v: 1,
      type: 'open',
      campaignId: campaign._id.toString(),
      recipientUserId: recipient.userId.toString(),
      recipientEmail: recipient.email,
      exp: Date.now() + TRACKING_TOKEN_TTL_MS,
    });
    return `${this.getTrackingBaseUrl()}/open?t=${encodeURIComponent(token)}`;
  }

  private buildClickTrackingUrl(
    campaign: EmailCampaignDocument,
    recipient: EmailRecipient,
    destinationUrl: string,
  ): string {
    const token = this.signTrackingPayload({
      v: 1,
      type: 'click',
      campaignId: campaign._id.toString(),
      recipientUserId: recipient.userId.toString(),
      recipientEmail: recipient.email,
      exp: Date.now() + TRACKING_TOKEN_TTL_MS,
      url: destinationUrl,
    });
    return `${this.getTrackingBaseUrl()}/click?t=${encodeURIComponent(token)}`;
  }

  private getTrackingBaseUrl(): string {
    const serverBase = (process.env.SERVER_URL || 'https://api.chabaqa.io').trim().replace(/\/+$/, '');
    return `${serverBase}/api/email-campaigns/track`;
  }

  private signTrackingPayload(payload: TrackingTokenPayload): string {
    const payloadPart = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const signature = this.signTrackingPayloadPart(payloadPart);
    return `${payloadPart}.${signature}`;
  }

  private parseTrackingToken(token: string | undefined, expectedType: TrackingEventType): TrackingTokenPayload | null {
    if (!token) return null;

    const [payloadPart, signature] = token.split('.');
    if (!payloadPart || !signature) return null;

    const expectedSignature = this.signTrackingPayloadPart(payloadPart);
    if (!this.safeTokenCompare(signature, expectedSignature)) return null;

    let payload: TrackingTokenPayload;
    try {
      payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8')) as TrackingTokenPayload;
    } catch {
      return null;
    }

    if (
      payload.v !== 1 ||
      payload.type !== expectedType ||
      !payload.campaignId ||
      !payload.recipientUserId ||
      !payload.recipientEmail ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }

    if (payload.exp <= Date.now()) return null;

    if (payload.type === 'click') {
      const normalizedDestination = this.normalizeTrackingDestination(payload.url || '');
      if (!normalizedDestination) return null;
      payload.url = normalizedDestination;
    }

    return payload;
  }

  private signTrackingPayloadPart(payloadPart: string): string {
    return createHmac('sha256', this.getTrackingSecret())
      .update(payloadPart)
      .digest('base64url');
  }

  private getTrackingSecret(): string {
    const secret =
      process.env.EMAIL_TRACKING_SECRET?.trim() ||
      process.env.JWT_SECRET?.trim() ||
      DEFAULT_TRACKING_SECRET;
    return secret;
  }

  private safeTokenCompare(tokenA: string, tokenB: string): boolean {
    const first = Buffer.from(tokenA);
    const second = Buffer.from(tokenB);
    if (first.length !== second.length) return false;
    return timingSafeEqual(first, second);
  }

  private normalizeTrackingDestination(rawUrl: string): string | null {
    if (!rawUrl) return null;
    const decoded = rawUrl.replace(/&amp;/gi, '&');
    return this.htmlSanitizer.sanitizeUrl(decoded, {
      allowRelative: false,
      allowedProtocols: ['http:', 'https:'],
    });
  }

  private parseRecipientObjectId(value: string): Types.ObjectId | null {
    if (!Types.ObjectId.isValid(value)) return null;
    return new Types.ObjectId(value);
  }

  private async persistCampaignSendState(campaign: EmailCampaignDocument): Promise<void> {
    const setOps: Record<string, any> = {
      status: campaign.status,
      sentAt: campaign.sentAt || new Date(),
      sentCount: campaign.sentCount,
      failedCount: campaign.failedCount,
    };
    const unsetOps: Record<string, 1> = {};

    campaign.recipients.forEach((recipient, index) => {
      setOps[`recipients.${index}.status`] = recipient.status;

      if (recipient.sentAt) {
        setOps[`recipients.${index}.sentAt`] = recipient.sentAt;
      } else {
        unsetOps[`recipients.${index}.sentAt`] = 1;
      }

      if (recipient.errorMessage) {
        setOps[`recipients.${index}.errorMessage`] = recipient.errorMessage;
      } else {
        unsetOps[`recipients.${index}.errorMessage`] = 1;
      }

      if (recipient.personalizedSubject) {
        setOps[`recipients.${index}.personalizedSubject`] = recipient.personalizedSubject;
      } else {
        unsetOps[`recipients.${index}.personalizedSubject`] = 1;
      }

      if (recipient.personalizedContent) {
        setOps[`recipients.${index}.personalizedContent`] = recipient.personalizedContent;
      } else {
        unsetOps[`recipients.${index}.personalizedContent`] = 1;
      }
    });

    const updateOps: Record<string, any> = { $set: setOps };
    if (Object.keys(unsetOps).length > 0) {
      updateOps.$unset = unsetOps;
    }

    await this.emailCampaignModel.updateOne({ _id: campaign._id }, updateOps).exec();
  }

  private getInvalidClickRedirectUrl(): string {
    return (process.env.FRONTEND_URL || 'https://chabaqa.io').trim().replace(/\/+$/, '');
  }

  private async buildMarketingPreviewVariables(
    creatorId: string,
    community: any,
    options: {
      campaignType?: EmailCampaignType;
      contentType?: MarketingContentType;
      contentId?: string;
      targetCourseId?: string;
      inactivityPeriod?: InactivityPeriod;
      sampleUserId?: string;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<Record<string, any>> {
    const [creator, sampleUser] = await Promise.all([
      this.findUserSnapshot(String(community?.createur || creatorId)),
      this.findMarketingSampleUser(community, options.sampleUserId),
    ]);
    const activity = sampleUser?._id
      ? await this.findUserActivitySnapshot(String(sampleUser._id), String(community._id))
      : null;
    const contentData = await this.resolveContentMarketingData(
      community,
      options.contentType || this.inferContentTypeFromCampaign(options.campaignType),
      options.contentId || options.targetCourseId,
    );
    const courseData = await this.resolveCourseMarketingData(
      community,
      sampleUser?._id ? String(sampleUser._id) : undefined,
      options.targetCourseId || String(contentData.contentId || ''),
    );

    const variables = {
      ...this.buildDateMarketingData(),
      ...this.buildCommunityMarketingData(community, creator),
      ...this.buildUserMarketingData(sampleUser),
      ...this.buildActivityMarketingData(activity, options.inactivityPeriod),
      ...contentData,
      ...courseData,
      campaignType: options.campaignType || '',
      ...(options.metadata || {}),
    };

    return this.normalizeMarketingVariables(variables);
  }

  private buildMarketingMergeFieldCatalog(
    sampleData: Record<string, any>,
    context: {
      campaignType?: EmailCampaignType;
      contentType?: MarketingContentType;
      targetCourseId?: string;
      inactivityPeriod?: InactivityPeriod;
    },
  ): MarketingMergeField[] {
    const field = (
      key: string,
      label: string,
      group: string,
      type: MarketingMergeField['type'],
      description: string,
      source: MarketingMergeField['source'],
      availability: string[],
    ): MarketingMergeField => ({
      key,
      token: `{{${key}}}`,
      label,
      group,
      type,
      description,
      source,
      availability,
      example: sampleData[key] ?? '',
    });

    const always = ['announcement', 'newsletter', 'promotion', 'welcome', 'custom'];
    const content = ['content-reminder', 'event', 'challenge', 'cours', 'product', 'session'];
    const course = ['course-progress', 'cours'];
    const inactive = ['inactive-users', 'reactivation'];

    return [
      field('userName', 'Full name', 'recipient', 'string', 'Recipient full display name.', 'user', always),
      field('userFirstName', 'First name', 'recipient', 'string', 'Recipient first name for friendly openers.', 'user', always),
      field('userEmail', 'Email', 'recipient', 'string', 'Recipient email address.', 'user', always),
      field('username', 'Username', 'recipient', 'string', 'Public username/handle when available.', 'user', always),
      field('userCountry', 'Country', 'recipient', 'string', 'Recipient country from profile.', 'user', always),
      field('userCity', 'City', 'recipient', 'string', 'Recipient city from profile.', 'user', always),
      field('userProfileUrl', 'Profile URL', 'recipient', 'url', 'Link to the public profile when a username exists.', 'user', always),
      field('memberSinceDays', 'Member age', 'recipient', 'number', 'Days since the user joined or was tracked in this community.', 'engagement', always),

      field('communityName', 'Community name', 'community', 'string', 'Selected community name.', 'community', always),
      field('communitySlug', 'Community slug', 'community', 'string', 'Selected community slug.', 'community', always),
      field('communityUrl', 'Community URL', 'community', 'url', 'Public URL for the community.', 'community', always),
      field('communityCategory', 'Community category', 'community', 'string', 'Community category.', 'community', always),
      field('communityMemberCount', 'Member count', 'community', 'number', 'Total members in the selected community.', 'community', always),
      field('communityCurrency', 'Currency', 'community', 'string', 'Default community currency.', 'community', always),
      field('communityPrice', 'Community price', 'community', 'number', 'Join price or configured community price.', 'community', always),
      field('communityWelcomeMessage', 'Welcome message', 'community', 'string', 'Configured community welcome copy.', 'community', always),
      field('creatorName', 'Creator name', 'community', 'string', 'Owner/creator display name.', 'community', always),

      field('currentDate', 'Current date', 'system', 'date', 'Current date in ISO format.', 'system', always),
      field('currentYear', 'Current year', 'system', 'number', 'Current year.', 'system', always),
      field('currentMonth', 'Current month', 'system', 'string', 'Current month name.', 'system', always),
      field('currentDayName', 'Current day', 'system', 'string', 'Current day of week.', 'system', always),

      field('lastLoginDate', 'Last login date', 'engagement', 'date', 'Last known login date in this community.', 'engagement', inactive),
      field('daysSinceLastLogin', 'Days inactive', 'engagement', 'number', 'Days since the last known login.', 'engagement', inactive),
      field('inactivityStatus', 'Inactivity status', 'engagement', 'string', 'Current inactivity bucket.', 'engagement', inactive),
      field('inactivityPeriod', 'Inactivity period', 'engagement', 'string', 'Selected inactivity period label.', 'engagement', inactive),
      field('daysThreshold', 'Days threshold', 'engagement', 'number', 'Selected inactivity threshold.', 'engagement', inactive),
      field('reactivationEmailCount', 'Reactivation email count', 'engagement', 'number', 'How many reactivation emails this user has received.', 'engagement', inactive),

      field('contentType', 'Content type key', 'content', 'string', 'Selected content type key.', 'content', content),
      field('contentTypeLabel', 'Content type label', 'content', 'string', 'Human-readable content type.', 'content', content),
      field('contentTitle', 'Content title', 'content', 'string', 'Selected content title.', 'content', content),
      field('contentDescription', 'Content description', 'content', 'string', 'Selected content description.', 'content', content),
      field('contentUrl', 'Content URL', 'content', 'url', 'Public URL for the selected content.', 'content', content),
      field('contentPrice', 'Content price', 'content', 'number', 'Selected content price.', 'content', content),
      field('contentCurrency', 'Content currency', 'content', 'string', 'Selected content currency.', 'content', content),
      field('contentPublishedAt', 'Published date', 'content', 'date', 'Published or created date for selected content.', 'content', content),

      field('courseTitle', 'Course title', 'course', 'string', 'Target course title.', 'course', course),
      field('courseProgressPct', 'Course progress', 'course', 'number', 'Recipient course completion percentage.', 'course', course),
      field('courseCompletedChapters', 'Completed chapters', 'course', 'number', 'Completed course chapters.', 'course', course),
      field('courseTotalChapters', 'Total chapters', 'course', 'number', 'Total chapters in the target course.', 'course', course),
      field('courseRemainingChapters', 'Remaining chapters', 'course', 'number', 'Remaining chapters to finish.', 'course', course),
      field('courseEnrolledDays', 'Enrollment age', 'course', 'number', 'Days since the recipient enrolled.', 'course', course),

      field('eventStartDate', 'Event start date', 'event', 'date', 'Selected event start date.', 'content', ['event']),
      field('eventStartTime', 'Event start time', 'event', 'string', 'Selected event start time.', 'content', ['event']),
      field('eventLocation', 'Event location', 'event', 'string', 'Selected event location or online URL.', 'content', ['event']),
      field('challengeEndDate', 'Challenge end date', 'challenge', 'date', 'Selected challenge end date.', 'content', ['challenge']),
      field('productSales', 'Product sales', 'product', 'number', 'Sales count for selected product.', 'content', ['product']),
      field('sessionDuration', 'Session duration', 'session', 'number', 'Duration in minutes for selected session.', 'content', ['session']),
    ].filter((item) => {
      if (!context.campaignType && !context.contentType && !context.targetCourseId && !context.inactivityPeriod) return true;
      const checks = [
        String(context.campaignType || ''),
        String(context.contentType || ''),
        context.targetCourseId ? 'course-progress' : '',
        context.inactivityPeriod ? 'inactive-users' : '',
      ].filter(Boolean);
      return item.availability.some((availability) => checks.includes(availability) || always.includes(availability));
    });
  }

  private groupMarketingFields(fields: MarketingMergeField[]): Array<{ key: string; label: string; fields: MarketingMergeField[] }> {
    const labels: Record<string, string> = {
      recipient: 'Recipient',
      community: 'Community',
      system: 'Date and System',
      engagement: 'Engagement',
      content: 'Content',
      course: 'Course Progress',
      event: 'Event',
      challenge: 'Challenge',
      product: 'Product',
      session: 'Session',
    };
    const order = ['recipient', 'community', 'system', 'engagement', 'content', 'course', 'event', 'challenge', 'product', 'session'];
    return order
      .map((key) => ({
        key,
        label: labels[key] || key,
        fields: fields.filter((field) => field.group === key),
      }))
      .filter((group) => group.fields.length > 0);
  }

  private async buildMarketingDataSummary(community: any): Promise<Record<string, any>> {
    const communityFilter = this.buildCommunityContentFilter(community);
    const [courseCount, challengeCount, eventCount, productCount, sessionCount, campaignCount, inactiveCount] =
      await Promise.all([
        this.safeCountDocuments(this.coursModel, { ...communityFilter, isPublished: true }),
        this.safeCountDocuments(this.challengeModel, { ...communityFilter }),
        this.safeCountDocuments(this.eventModel, { ...communityFilter }),
        this.safeCountDocuments(this.productModel, { ...communityFilter, isPublished: true }),
        this.safeCountDocuments(this.sessionModel, { ...communityFilter, isActive: true }),
        this.safeCountDocuments(this.emailCampaignModel, { communityId: community._id }),
        this.safeCountDocuments(this.userLoginActivityModel, {
          communityId: community._id,
          isReactivationTarget: true,
        }),
      ]);

    return {
      members: Array.isArray(community?.members) ? community.members.length : community?.membersCount || 0,
      courses: courseCount,
      challenges: challengeCount,
      events: eventCount,
      products: productCount,
      sessions: sessionCount,
      campaigns: campaignCount,
      inactiveMembers: inactiveCount,
    };
  }

  private async safeCountDocuments(model: any, filter: Record<string, any>): Promise<number> {
    if (!model || typeof model.countDocuments !== 'function') return 0;
    try {
      return await model.countDocuments(filter).exec();
    } catch {
      return 0;
    }
  }

  private async findMarketingSampleUser(community: any, sampleUserId?: string): Promise<any | null> {
    if (sampleUserId && Types.ObjectId.isValid(sampleUserId)) {
      const byId = await this.findUserSnapshot(sampleUserId);
      if (byId) return byId;
    }

    const memberIds = Array.isArray(community?.members) ? community.members : [];
    const model: any = this.userModel;
    if (!memberIds.length || typeof model.findOne !== 'function') {
      return {
        _id: '',
        name: 'Test User',
        email: 'member@example.com',
        username: 'test-user',
      };
    }

    try {
      return await model
        .findOne({ _id: { $in: memberIds } })
        .select('_id name email username pays ville createdAt profile_picture photo_profil')
        .lean()
        .exec();
    } catch {
      return null;
    }
  }

  private async findUserSnapshot(userId?: string): Promise<any | null> {
    if (!userId || !Types.ObjectId.isValid(userId)) return null;
    const model: any = this.userModel;
    if (typeof model.findById !== 'function') return null;
    try {
      return await model
        .findById(userId)
        .select('_id name email username pays ville createdAt profile_picture photo_profil')
        .lean()
        .exec();
    } catch {
      return null;
    }
  }

  private async findUserActivitySnapshot(userId?: string, communityId?: string): Promise<any | null> {
    if (!userId || !communityId || !Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(communityId)) return null;
    const model: any = this.userLoginActivityModel;
    if (typeof model.findOne !== 'function') return null;
    try {
      return await model
        .findOne({
          userId: new Types.ObjectId(userId),
          communityId: new Types.ObjectId(communityId),
        })
        .lean()
        .exec();
    } catch {
      return null;
    }
  }

  private buildUserMarketingData(user: any): Record<string, any> {
    const name = user?.name || 'Test User';
    const username = user?.username || '';
    return {
      userId: user?._id ? String(user._id) : '',
      userName: name,
      userFirstName: this.getFirstName(name),
      userEmail: user?.email || 'member@example.com',
      username,
      userCountry: user?.pays || '',
      userCity: user?.ville || '',
      userProfileImage: user?.profile_picture || user?.photo_profil || '',
      userProfileUrl: username ? `${this.getFrontendBaseUrl()}/profile/${encodeURIComponent(username)}` : '',
      userCreatedAt: this.formatMarketingDate(user?.createdAt),
    };
  }

  private buildCommunityMarketingData(community: any, creator: any): Record<string, any> {
    const memberCount = Array.isArray(community?.members) ? community.members.length : community?.membersCount || 0;
    const pricing = community?.pricing || {};
    const price = pricing.price ?? community?.price ?? community?.fees_of_join ?? 0;
    const currency = pricing.currency || community?.currency || 'TND';
    return {
      communityId: community?._id ? String(community._id) : '',
      communityName: community?.name || '',
      communitySlug: community?.slug || '',
      communityUrl: this.buildCommunityUrl(community),
      communityCategory: community?.category || '',
      communityMemberCount: memberCount,
      communityCurrency: currency,
      communityPrice: price,
      communityWelcomeMessage: community?.settings?.welcomeMessage || '',
      communityInviteLink: community?.inviteLink || '',
      creatorName: creator?.name || '',
      creatorEmail: creator?.email || '',
    };
  }

  private buildActivityMarketingData(activity: any, period?: InactivityPeriod): Record<string, any> {
    const daysSinceLastLogin = activity?.daysSinceLastLogin ?? this.getDaysThreshold(period || InactivityPeriod.LAST_7_DAYS);
    return {
      lastLoginDate: this.formatMarketingDate(activity?.lastLoginAt),
      daysSinceLastLogin,
      inactivityStatus: activity?.inactivityStatus || '',
      inactivityPeriod: inactivityPeriodToText(period),
      daysThreshold: this.getDaysThreshold(period || InactivityPeriod.LAST_7_DAYS),
      lastReactivationEmailSent: this.formatMarketingDate(activity?.lastReactivationEmailSent),
      reactivationEmailCount: activity?.reactivationEmailCount || 0,
      joinedAt: this.formatMarketingDate(activity?.joinedAt),
      memberSinceDays: activity?.joinedAt ? this.daysBetween(activity.joinedAt, new Date()) : '',
    };
  }

  private buildDateMarketingData(): Record<string, any> {
    const now = new Date();
    return {
      currentDate: now.toISOString().slice(0, 10),
      currentYear: now.getUTCFullYear(),
      currentMonth: now.toLocaleString('en-US', { month: 'long' }),
      currentDayName: now.toLocaleString('en-US', { weekday: 'long' }),
    };
  }

  private async resolveContentMarketingData(
    community: any,
    contentType: MarketingContentType | undefined,
    contentId?: string,
  ): Promise<MarketingContentData> {
    const type = contentType || 'all';
    const label = contentTypeToLabel(type);
    const fallback = {
      contentType: type,
      contentTypeLabel: label || 'content',
      contentId: contentId || '',
      contentTitle: label ? `${community?.name || 'Community'} ${label}` : community?.name || 'Community content',
      contentDescription: '',
      contentUrl: this.buildCommunityUrl(community),
      contentPrice: '',
      contentCurrency: community?.currency || 'TND',
      contentPublishedAt: '',
    };

    if (!contentId || type === 'all') return fallback;
    const model = this.getContentModel(type);
    if (!model || typeof model.findOne !== 'function') return fallback;

    try {
      const item = await model
        .findOne(this.buildContentLookupFilter(community, contentId))
        .lean()
        .exec();
      if (!item) return fallback;
      return {
        ...fallback,
        ...this.normalizeContentMarketingData(type, item, community),
      };
    } catch {
      return fallback;
    }
  }

  private getContentModel(contentType: MarketingContentType): Model<any> | null {
    switch (contentType) {
      case 'cours':
        return this.coursModel;
      case 'challenge':
        return this.challengeModel;
      case 'event':
        return this.eventModel;
      case 'product':
        return this.productModel;
      case 'session':
        return this.sessionModel;
      default:
        return null;
    }
  }

  private buildContentLookupFilter(community: any, contentId: string): Record<string, any> {
    const idClauses: Record<string, any>[] = [{ id: contentId }, { slug: contentId }];
    if (Types.ObjectId.isValid(contentId)) {
      idClauses.push({ _id: new Types.ObjectId(contentId) });
    }
    const communityId = String(community?._id || '');
    const communityClauses: Record<string, any>[] = [{ communityId }];
    if (Types.ObjectId.isValid(communityId)) {
      communityClauses.push({ communityId: new Types.ObjectId(communityId) });
    }
    return { $and: [{ $or: idClauses }, { $or: communityClauses }] };
  }

  private buildCommunityContentFilter(community: any): Record<string, any> {
    const communityId = String(community?._id || '');
    const clauses: Record<string, any>[] = [{ communityId }];
    if (Types.ObjectId.isValid(communityId)) {
      clauses.push({ communityId: new Types.ObjectId(communityId) });
    }
    return { $or: clauses };
  }

  private normalizeContentMarketingData(type: MarketingContentType, item: any, community: any): MarketingContentData {
    const title = item?.title || item?.titre || item?.name || '';
    const price = item?.price ?? item?.prix ?? item?.pricing?.price ?? '';
    const currency = item?.currency || item?.devise || item?.pricing?.currency || community?.currency || 'TND';
    const contentUrl = this.buildContentUrl(type, item, community);
    const base = {
      contentType: type,
      contentTypeLabel: contentTypeToLabel(type),
      contentId: String(item?._id || item?.id || ''),
      contentTitle: title,
      contentDescription: item?.description || item?.short_description || item?.notes || '',
      contentUrl,
      contentPrice: price,
      contentCurrency: currency,
      contentPublishedAt: this.formatMarketingDate(item?.publishedAt || item?.createdAt),
    };

    if (type === 'event') {
      return {
        ...base,
        eventStartDate: this.formatMarketingDate(item?.startDate),
        eventStartTime: item?.startTime || '',
        eventEndTime: item?.endTime || '',
        eventTimezone: item?.timezone || '',
        eventLocation: item?.location || item?.onlineUrl || '',
        eventAttendeeCount: item?.totalAttendees ?? (Array.isArray(item?.attendees) ? item.attendees.length : ''),
      };
    }

    if (type === 'challenge') {
      return {
        ...base,
        challengeStartDate: this.formatMarketingDate(item?.startDate),
        challengeEndDate: this.formatMarketingDate(item?.endDate),
        challengeParticipantCount: Array.isArray(item?.participants) ? item.participants.length : '',
        challengeReward: item?.completionReward ?? '',
        challengeDifficulty: item?.difficulty || '',
      };
    }

    if (type === 'product') {
      return {
        ...base,
        productSales: item?.sales ?? 0,
        productInventory: item?.inventory ?? '',
        productCategory: item?.category || '',
      };
    }

    if (type === 'session') {
      return {
        ...base,
        sessionDuration: item?.duration ?? '',
        sessionCategory: item?.category || '',
        sessionRating: item?.averageRating ?? '',
      };
    }

    if (type === 'cours') {
      const totalChapters = this.countCourseChapters(item);
      return {
        ...base,
        courseTitle: title,
        courseTotalChapters: totalChapters,
        courseLevel: item?.niveau || '',
        courseCategory: item?.category || '',
      };
    }

    return base;
  }

  private async resolveCourseMarketingData(
    community: any,
    userId?: string,
    courseId?: string,
  ): Promise<MarketingContentData> {
    if (!courseId) return {};
    const course = await this.findContentItem('cours', community, courseId);
    if (!course) return {};

    const base = this.normalizeContentMarketingData('cours', course, community);
    if (!userId || !Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(String(course._id))) {
      return {
        ...base,
        courseProgressPct: base.courseProgressPct || 0,
        courseCompletedChapters: base.courseCompletedChapters || 0,
        courseRemainingChapters: base.courseTotalChapters || 0,
        courseEnrolledDays: '',
      };
    }

    const enrollment = await this.findCourseEnrollment(userId, String(course._id));
    return {
      ...base,
      ...this.buildCourseProgressMergeData(course, enrollment),
    };
  }

  private async findContentItem(contentType: MarketingContentType, community: any, contentId: string): Promise<any | null> {
    const model = this.getContentModel(contentType);
    if (!model || typeof model.findOne !== 'function') return null;
    try {
      return await model
        .findOne(this.buildContentLookupFilter(community, contentId))
        .lean()
        .exec();
    } catch {
      return null;
    }
  }

  private async findCourseEnrollment(userId: string, courseId: string): Promise<any | null> {
    const model: any = this.courseEnrollmentModel;
    if (typeof model.findOne !== 'function') return null;
    try {
      return await model
        .findOne({
          userId: new Types.ObjectId(userId),
          courseId: new Types.ObjectId(courseId),
          isActive: true,
        })
        .lean()
        .exec();
    } catch {
      return null;
    }
  }

  private buildCourseProgressMergeData(course: any, enrollment: any): Record<string, any> {
    const totalChapters = this.countCourseChapters(course, enrollment);
    const progressEntries: Array<{ isCompleted: boolean; lastAccessedAt?: Date }> = Array.isArray(enrollment?.progression)
      ? enrollment.progression
      : [];
    const completedChapters = progressEntries.filter((progress) => progress.isCompleted).length;
    const progressPct = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
    const enrolledAt = enrollment?.enrolledAt || enrollment?.createdAt;
    const lastAccessedAt = progressEntries
      .map((progress) => progress.lastAccessedAt)
      .filter(Boolean)
      .sort((a, b) => new Date(b as any).getTime() - new Date(a as any).getTime())[0];

    return {
      courseTitle: course?.titre || course?.title || '',
      courseProgressPct: progressPct,
      progressPct,
      courseCompletedChapters: completedChapters,
      courseTotalChapters: totalChapters,
      courseRemainingChapters: Math.max(totalChapters - completedChapters, 0),
      courseEnrolledAt: this.formatMarketingDate(enrolledAt),
      courseEnrolledDays: enrolledAt ? this.daysBetween(enrolledAt, new Date()) : '',
      courseLastAccessedAt: this.formatMarketingDate(lastAccessedAt),
    };
  }

  private countCourseChapters(course: any, enrollment?: any): number {
    const sections = Array.isArray(course?.sections) ? course.sections : [];
    const sectionChapters = sections.reduce((sum, section) => sum + (Array.isArray(section?.chapitres) ? section.chapitres.length : 0), 0);
    if (sectionChapters > 0) return sectionChapters;
    return Array.isArray(enrollment?.progression) ? enrollment.progression.length : 0;
  }

  private buildContentUrl(type: MarketingContentType, item: any, community: any): string {
    const id = encodeURIComponent(String(item?.slug || item?.id || item?._id || ''));
    const communitySlug = encodeURIComponent(String(community?.slug || 'community'));
    const creatorSlug = encodeURIComponent(String(community?.creatorSlug || community?.createur?.username || 'community'));
    const route = type === 'cours' ? 'courses' : type === 'event' ? 'events' : `${type}s`;
    return `${this.getFrontendBaseUrl()}/${creatorSlug}/${communitySlug}/${route}/${id}`;
  }

  private buildCommunityUrl(community: any): string {
    const slug = community?.slug ? encodeURIComponent(String(community.slug)) : '';
    if (!slug) return this.getFrontendBaseUrl();
    return `${this.getFrontendBaseUrl()}/community/${slug}`;
  }

  private getFrontendBaseUrl(): string {
    return (process.env.FRONTEND_URL || 'https://chabaqa.io').trim().replace(/\/+$/, '');
  }

  private inferContentTypeFromCampaign(type?: EmailCampaignType): MarketingContentType | undefined {
    if (type === EmailCampaignType.EVENT_REMINDER) return 'event';
    if (type === EmailCampaignType.COURSE_UPDATE || type === EmailCampaignType.COURSE_PROGRESS_REMINDER) return 'cours';
    return undefined;
  }

  private extractTemplateTokens(template: string): string[] {
    const tokens = new Set<string>();
    const regex = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(template)) !== null) {
      tokens.add(match[1]);
    }
    return Array.from(tokens).sort();
  }

  private pickMarketingDataByPrefix(data: Record<string, any>, prefixes: string[]): MarketingContentData {
    return Object.entries(data).reduce((result, [key, value]) => {
      if (prefixes.some((prefix) => key === prefix || key.toLowerCase().startsWith(prefix.toLowerCase()))) {
        result[key] = value;
      }
      return result;
    }, {} as MarketingContentData);
  }

  private normalizeMarketingVariables(data: Record<string, any>): Record<string, any> {
    return Object.entries(data).reduce((result, [key, value]) => {
      result[key] = value === null || value === undefined ? '' : value;
      return result;
    }, {} as Record<string, any>);
  }

  private getFirstName(name?: string): string {
    const clean = String(name || '').trim();
    if (!clean) return 'there';
    return clean.split(/\s+/)[0];
  }

  private formatMarketingDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  }

  private daysBetween(start: any, end: Date): number {
    const startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) return 0;
    return Math.max(0, Math.floor((end.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  private buildBaseVariables(input: {
    recipientName: string;
    communityName: string;
    targetDaysThreshold?: number;
    targetInactivityPeriod?: InactivityPeriod;
    contentType?: string;
  }): Record<string, string | number> {
    const now = new Date();
    const contentType = input.contentType || '';
    return {
      userName: input.recipientName || '',
      communityName: input.communityName || '',
      currentDate: now.toISOString().slice(0, 10),
      currentYear: now.getUTCFullYear(),
      daysThreshold: input.targetDaysThreshold || '',
      inactivityPeriod: inactivityPeriodToText(input.targetInactivityPeriod),
      contentType,
      contentTypeLabel: contentTypeToLabel(contentType),
    };
  }

  private async updateReactivationEmailTracking(campaign: EmailCampaignDocument): Promise<void> {
    const sentRecipients = campaign.recipients.filter((recipient) => recipient.status === 'sent');
    await Promise.all(
      sentRecipients.map((recipient) =>
        this.userLoginActivityService.updateReactivationEmailSent(
          recipient.userId.toString(),
          campaign.communityId.toString(),
        ),
      ),
    );
  }

  private getDaysThreshold(period: InactivityPeriod): number {
    switch (period) {
      case InactivityPeriod.LAST_7_DAYS:
        return 7;
      case InactivityPeriod.LAST_15_DAYS:
        return 15;
      case InactivityPeriod.LAST_30_DAYS:
        return 30;
      case InactivityPeriod.LAST_60_DAYS:
        return 60;
      case InactivityPeriod.MORE_THAN_60_DAYS:
        return 61;
      default:
        return 7;
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < array.length; index += size) {
      chunks.push(array.slice(index, index + size));
    }
    return chunks;
  }
}
