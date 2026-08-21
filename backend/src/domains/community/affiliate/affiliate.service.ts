import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { AffiliateProgram, AffiliateProgramDocument } from '@/domains/community/affiliate/schemas/affiliate-program.schema';
import { AffiliatePartner, AffiliatePartnerDocument } from '@/domains/community/affiliate/schemas/affiliate-partner.schema';
import { AffiliateLink, AffiliateLinkDocument } from '@/domains/community/affiliate/schemas/affiliate-link.schema';
import { AffiliateClick, AffiliateClickDocument } from '@/domains/community/affiliate/schemas/affiliate-click.schema';
import { AffiliateConversion, AffiliateConversionDocument } from '@/domains/community/affiliate/schemas/affiliate-conversion.schema';
import {
  AffiliateCommissionPreviewDto,
  AffiliateMarketingQueryDto,
  CreateProgramDto,
  UpdateProgramDto,
  InvitePartnerDto,
  CreateLinkDto,
  UpdatePartnerDto,
} from '@/domains/community/affiliate/dto/affiliate.dto';
import {
  AFFILIATE_MARKETING_TEMPLATES,
  extractAffiliateTemplateTokens,
  renderAffiliateTemplate,
} from '@/domains/community/affiliate/affiliate-marketing-templates';

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function generateBase62(length = 8): string {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += BASE62[bytes[i] % 62];
  }
  return result;
}

@Injectable()
export class AffiliateService {
  private readonly logger = new Logger(AffiliateService.name);

  constructor(
    @InjectModel(AffiliateProgram.name) private readonly programModel: Model<AffiliateProgramDocument>,
    @InjectModel(AffiliatePartner.name) private readonly partnerModel: Model<AffiliatePartnerDocument>,
    @InjectModel(AffiliateLink.name) private readonly linkModel: Model<AffiliateLinkDocument>,
    @InjectModel(AffiliateClick.name) private readonly clickModel: Model<AffiliateClickDocument>,
    @InjectModel(AffiliateConversion.name) private readonly conversionModel: Model<AffiliateConversionDocument>,
    @InjectModel('User') private readonly userModel: Model<any>,
  ) {}

  private async generateUniqueLinkCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = generateBase62(8);
      const existing = await this.linkModel.exists({ code });
      if (!existing) return code;
    }
    return generateBase62(12);
  }

  // ── Program CRUD (Creator) ──

  async createProgram(creatorId: string, dto: CreateProgramDto): Promise<AffiliateProgramDocument> {
    if (dto.scopeType === 'community' && !dto.communityId) {
      throw new BadRequestException('communityId is required for community-scoped programs');
    }
    const program = await this.programModel.create({
      creatorId: new Types.ObjectId(creatorId),
      communityId: dto.communityId ? new Types.ObjectId(dto.communityId) : undefined,
      name: dto.name,
      description: dto.description,
      scopeType: dto.scopeType,
      scopeContentType: dto.scopeContentType,
      scopeContentId: dto.scopeContentId,
      commissionPercent: dto.commissionPercent,
      cookieWindowDays: dto.cookieWindowDays ?? Number(process.env.AFFILIATE_DEFAULT_COOKIE_DAYS || 30),
      holdDays: dto.holdDays ?? Number(process.env.AFFILIATE_DEFAULT_HOLD_DAYS || 14),
      attributionModel: dto.attributionModel || 'last_click',
      autoApprovePartners: Boolean(dto.autoApprovePartners),
      terms: dto.terms,
      status: 'active',
    });

    // Ensure creators can generate and use their own referral links without
    // requiring a separate partner invite/approval flow.
    await this.partnerModel.findOneAndUpdate(
      {
        programId: program._id,
        partnerUserId: new Types.ObjectId(creatorId),
      },
      {
        $setOnInsert: {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: new Types.ObjectId(creatorId),
        },
      },
      { upsert: true, new: true },
    );

    return program;
  }

  async getCreatorPrograms(creatorId: string): Promise<AffiliateProgramDocument[]> {
    return this.programModel.find({ creatorId: new Types.ObjectId(creatorId) }).sort({ createdAt: -1 });
  }

  async updateProgram(creatorId: string, programId: string, dto: UpdateProgramDto): Promise<AffiliateProgramDocument> {
    const program = await this.programModel.findOne({
      _id: new Types.ObjectId(programId),
      creatorId: new Types.ObjectId(creatorId),
    });
    if (!program) throw new NotFoundException('Program not found');

    if (dto.name !== undefined) program.name = dto.name;
    if (dto.description !== undefined) program.description = dto.description;
    if (dto.commissionPercent !== undefined) program.commissionPercent = dto.commissionPercent;
    if (dto.status !== undefined) program.status = dto.status;
    if (dto.cookieWindowDays !== undefined) program.cookieWindowDays = dto.cookieWindowDays;
    if (dto.holdDays !== undefined) program.holdDays = dto.holdDays;
    if (dto.attributionModel !== undefined) program.attributionModel = dto.attributionModel;
    if (dto.autoApprovePartners !== undefined) program.autoApprovePartners = dto.autoApprovePartners;
    if (dto.terms !== undefined) program.terms = dto.terms;

    return program.save();
  }

  // ── Partner management (Creator) ──

  async invitePartner(
    creatorId: string,
    programId: string,
    dto: InvitePartnerDto,
  ): Promise<AffiliatePartnerDocument> {
    const program = await this.programModel.findOne({
      _id: new Types.ObjectId(programId),
      creatorId: new Types.ObjectId(creatorId),
    });
    if (!program) throw new NotFoundException('Program not found');

    let targetUserId: string | undefined = dto.userId;
    if (!targetUserId && dto.email) {
      const user = await this.userModel.findOne({ email: dto.email }).select('_id');
      if (!user) throw new BadRequestException('No user found with that email');
      targetUserId = user._id.toString();
    }
    if (!targetUserId) throw new BadRequestException('Provide userId or email');

    if (targetUserId === creatorId) {
      throw new BadRequestException('Cannot invite yourself as partner');
    }

    const existing = await this.partnerModel.findOne({
      programId: program._id,
      partnerUserId: new Types.ObjectId(targetUserId),
    });
    if (existing) {
      if (existing.status === 'rejected') {
        existing.status = program.autoApprovePartners ? 'approved' : 'pending';
        existing.displayName = dto.displayName || existing.displayName;
        existing.inviteEmail = dto.email?.toLowerCase() || existing.inviteEmail;
        existing.tags = dto.tags || existing.tags;
        existing.customCommissionPercent = dto.customCommissionPercent ?? existing.customCommissionPercent;
        existing.couponCode = dto.couponCode || existing.couponCode;
        existing.source = dto.source || existing.source;
        existing.notes = dto.notes || existing.notes;
        if (existing.status === 'approved') {
          existing.approvedAt = new Date();
          existing.approvedBy = new Types.ObjectId(creatorId);
        }
        return existing.save();
      }
      throw new BadRequestException('Partner already exists for this program');
    }

    return this.partnerModel.create({
      programId: program._id,
      partnerUserId: new Types.ObjectId(targetUserId),
      inviteEmail: dto.email?.toLowerCase(),
      displayName: dto.displayName,
      tags: dto.tags || [],
      customCommissionPercent: dto.customCommissionPercent,
      couponCode: dto.couponCode,
      source: dto.source,
      notes: dto.notes,
      status: program.autoApprovePartners ? 'approved' : 'pending',
      approvedAt: program.autoApprovePartners ? new Date() : undefined,
      approvedBy: program.autoApprovePartners ? new Types.ObjectId(creatorId) : undefined,
    });
  }

  async updatePartnerStatus(
    creatorId: string,
    partnerId: string,
    dtoOrStatus: UpdatePartnerDto | 'approved' | 'rejected' | 'paused',
    approvedById?: string,
  ): Promise<AffiliatePartnerDocument> {
    const partner = await this.partnerModel.findById(partnerId).populate('programId');
    if (!partner) throw new NotFoundException('Partner not found');

    const program = partner.programId as any as AffiliateProgramDocument;
    if (program.creatorId.toString() !== creatorId) {
      throw new ForbiddenException('Not the program owner');
    }

    const dto = typeof dtoOrStatus === 'string' ? { status: dtoOrStatus } : dtoOrStatus;
    const status = dto.status;
    partner.status = status;
    if (dto.displayName !== undefined) partner.displayName = dto.displayName;
    if (dto.tags !== undefined) partner.tags = dto.tags;
    if (dto.customCommissionPercent !== undefined) partner.customCommissionPercent = dto.customCommissionPercent;
    if (dto.couponCode !== undefined) partner.couponCode = dto.couponCode;
    if (dto.source !== undefined) partner.source = dto.source;
    if (dto.notes !== undefined) partner.notes = dto.notes;
    if (status === 'approved') {
      partner.approvedAt = new Date();
      partner.approvedBy = new Types.ObjectId(approvedById || creatorId);
    }
    return partner.save();
  }

  async getCreatorPartners(creatorId: string, programId?: string): Promise<AffiliatePartnerDocument[]> {
    const programIds = programId
      ? [new Types.ObjectId(programId)]
      : (await this.programModel.find({ creatorId: new Types.ObjectId(creatorId) }).select('_id'))
          .map((p) => p._id);
    return this.partnerModel.find({ programId: { $in: programIds } }).populate('partnerUserId', 'name email');
  }

  // ── Link management ──

  async createLink(creatorId: string, dto: CreateLinkDto): Promise<AffiliateLinkDocument> {
    const program = await this.programModel.findOne({
      _id: new Types.ObjectId(dto.programId),
      creatorId: new Types.ObjectId(creatorId),
    });
    if (!program) throw new NotFoundException('Program not found');

    let partnerUserId = dto.partnerUserId || creatorId;

    if (!dto.partnerUserId) {
      await this.partnerModel.findOneAndUpdate(
        {
          programId: program._id,
          partnerUserId: new Types.ObjectId(creatorId),
        },
        {
          $set: {
            status: 'approved',
            approvedAt: new Date(),
            approvedBy: new Types.ObjectId(creatorId),
          },
        },
        { upsert: true, new: true },
      );
      partnerUserId = creatorId;
    } else {
      const partner = await this.partnerModel.findOne({
        programId: program._id,
        partnerUserId: new Types.ObjectId(partnerUserId),
        status: 'approved',
      });
      if (!partner) throw new BadRequestException('Partner not approved for this program');
    }

    if (!dto.targetPath.startsWith('/')) {
      throw new BadRequestException('targetPath must start with /');
    }

    const code = await this.generateUniqueLinkCode();
    return this.linkModel.create({
      programId: program._id,
      partnerUserId: new Types.ObjectId(partnerUserId),
      code,
      label: dto.label,
      targetPath: dto.targetPath,
      targetContentType: dto.targetContentType,
      targetContentId: dto.targetContentId,
      communityId: dto.communityId ? new Types.ObjectId(dto.communityId) : program.communityId,
      creatorId: program.creatorId,
      campaignName: dto.campaignName,
      utmSource: dto.utmSource,
      utmMedium: dto.utmMedium,
      utmCampaign: dto.utmCampaign,
      utmTerm: dto.utmTerm,
      utmContent: dto.utmContent,
      tags: dto.tags || [],
      isArchived: false,
      clickCount: 0,
    });
  }

  async createPartnerLink(
    partnerUserId: string,
    dto: {
      programId: string;
      targetPath: string;
      targetContentType?: any;
      targetContentId?: string;
      communityId?: string;
      label?: string;
      campaignName?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmTerm?: string;
      utmContent?: string;
      tags?: string[];
    },
  ): Promise<AffiliateLinkDocument> {
    const partner = await this.partnerModel.findOne({
      programId: new Types.ObjectId(dto.programId),
      partnerUserId: new Types.ObjectId(partnerUserId),
      status: 'approved',
    });
    if (!partner) throw new BadRequestException('You are not an approved partner for this program');

    const program = await this.programModel.findById(dto.programId);
    if (!program || program.status !== 'active') throw new BadRequestException('Program not active');

    if (!dto.targetPath.startsWith('/')) {
      throw new BadRequestException('targetPath must start with /');
    }

    const code = await this.generateUniqueLinkCode();
    return this.linkModel.create({
      programId: program._id,
      partnerUserId: new Types.ObjectId(partnerUserId),
      code,
      label: dto.label,
      targetPath: dto.targetPath,
      targetContentType: dto.targetContentType,
      targetContentId: dto.targetContentId,
      communityId: dto.communityId ? new Types.ObjectId(dto.communityId) : program.communityId,
      creatorId: program.creatorId,
      campaignName: dto.campaignName,
      utmSource: dto.utmSource,
      utmMedium: dto.utmMedium,
      utmCampaign: dto.utmCampaign,
      utmTerm: dto.utmTerm,
      utmContent: dto.utmContent,
      tags: dto.tags || [],
      isArchived: false,
      clickCount: 0,
    });
  }

  async getPartnerLinks(partnerUserId: string): Promise<AffiliateLinkDocument[]> {
    return this.linkModel.find({ partnerUserId: new Types.ObjectId(partnerUserId) });
  }

  async getPartnerPrograms(partnerUserId: string): Promise<any[]> {
    const partners = await this.partnerModel
      .find({ partnerUserId: new Types.ObjectId(partnerUserId), status: 'approved' })
      .populate('programId');
    return partners.map((p) => ({ partner: p, program: p.programId }));
  }

  // ── Link resolution (public redirect) ──

  async resolveLink(code: string): Promise<{
    link: AffiliateLinkDocument;
    program: AffiliateProgramDocument;
    partner: AffiliatePartnerDocument;
  } | null> {
    const link = await this.linkModel.findOne({ code });
    if (!link) return null;

    const program = await this.programModel.findById(link.programId);
    if (!program || program.status !== 'active') return null;

    const partner = await this.partnerModel.findOne({
      programId: program._id,
      partnerUserId: link.partnerUserId,
      status: 'approved',
    });
    if (!partner) return null;

    return { link, program, partner };
  }

  // ── Stats ──

  async getCreatorStats(creatorId: string, query: AffiliateMarketingQueryDto = {}): Promise<any> {
    const marketing = await this.getCreatorMarketingData(creatorId, {
      ...query,
      includeTemplates: query.includeTemplates ?? 'false',
    });

    return {
      clicks: marketing.summary.clicks,
      conversions: marketing.summary.conversions,
      totalCommissionDT: marketing.summary.totalCommissionDT,
      totalRevenueDT: marketing.summary.totalRevenueDT,
      topPartners: marketing.leaderboards.partners,
      ...marketing,
    };
  }

  async previewAffiliateCommission(
    creatorId: string,
    dto: AffiliateCommissionPreviewDto,
  ): Promise<any> {
    let program: AffiliateProgramDocument | null = null;
    if (dto.programId) {
      program = await this.programModel.findOne({
        _id: new Types.ObjectId(dto.programId),
        creatorId: new Types.ObjectId(creatorId),
      });
      if (!program) throw new NotFoundException('Program not found');
    }

    const commissionPercent = dto.commissionPercent ?? program?.commissionPercent ?? 15;
    const creatorNetDT = dto.creatorNetDT ?? dto.amountDT;
    const commissionDT = this.roundCurrency((creatorNetDT * commissionPercent) / 100);
    const creatorKeepsDT = this.roundCurrency(Math.max(0, creatorNetDT - commissionDT));

    return {
      amountDT: this.roundCurrency(dto.amountDT),
      creatorNetDT: this.roundCurrency(creatorNetDT),
      commissionPercent,
      commissionDT,
      creatorKeepsDT,
      currency: 'TND',
      holdDays: program?.holdDays ?? Number(process.env.AFFILIATE_DEFAULT_HOLD_DAYS || 14),
      cookieWindowDays: program?.cookieWindowDays ?? Number(process.env.AFFILIATE_DEFAULT_COOKIE_DAYS || 30),
      attributionModel: program?.attributionModel || 'last_click',
    };
  }

  async getCreatorMarketingData(creatorId: string, query: AffiliateMarketingQueryDto = {}): Promise<any> {
    const creatorObjectId = new Types.ObjectId(creatorId);
    const range = this.resolveMarketingDateRange(query);
    const limit = this.clampInt(query.limit, 10, 3, 50);
    const interval = query.interval || 'daily';
    const includeTemplates = String(query.includeTemplates ?? 'true') !== 'false';

    const programFilter: any = { creatorId: creatorObjectId };
    if (query.communityId && Types.ObjectId.isValid(query.communityId)) {
      programFilter.communityId = new Types.ObjectId(query.communityId);
    }
    if (query.programId && Types.ObjectId.isValid(query.programId)) {
      programFilter._id = new Types.ObjectId(query.programId);
    }

    const [programs, creator] = await Promise.all([
      this.programModel.find(programFilter).lean(),
      this.userModel.findById(creatorObjectId).select('name email username').lean(),
    ]);

    const programIds = programs.map((program: any) => program._id);
    const empty = this.buildEmptyMarketingResponse({
      creator,
      programs,
      query,
      range,
      includeTemplates,
    });
    if (programIds.length === 0) return empty;

    const partnerObjectId = query.partnerUserId && Types.ObjectId.isValid(query.partnerUserId)
      ? new Types.ObjectId(query.partnerUserId)
      : undefined;
    const dateMatch = { $gte: range.from, $lte: range.to };
    const clickMatch: any = { programId: { $in: programIds }, createdAt: dateMatch };
    const conversionMatch: any = { programId: { $in: programIds }, createdAt: dateMatch };
    const partnerMatch: any = { programId: { $in: programIds } };
    const linkMatch: any = { programId: { $in: programIds } };
    if (partnerObjectId) {
      clickMatch.partnerUserId = partnerObjectId;
      conversionMatch.partnerUserId = partnerObjectId;
      partnerMatch.partnerUserId = partnerObjectId;
      linkMatch.partnerUserId = partnerObjectId;
    }

    const validConversionStatuses = ['pending', 'approved', 'paid'];

    const [
      clickSummaryRows,
      conversionSummaryRows,
      partnerStatusRows,
      linkCount,
      clickSeriesRows,
      conversionSeriesRows,
      clicksByPartner,
      conversionsByPartner,
      clicksByLink,
      conversionsByLink,
      clicksBySource,
      conversionsBySource,
      clicksByDevice,
      conversionsByDevice,
      clicksByContent,
      conversionsByContent,
      recentLinks,
      nextReleases,
    ] = await Promise.all([
      this.clickModel.aggregate([
        { $match: clickMatch },
        {
          $group: {
            _id: null,
            clicks: { $sum: 1 },
            botClicks: { $sum: { $cond: ['$isBot', 1, 0] } },
            uniqueVisitors: {
              $addToSet: {
                $concat: [
                  { $ifNull: ['$ipHash', '$clickId'] },
                  ':',
                  { $ifNull: ['$userAgentHash', 'unknown'] },
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            clicks: 1,
            botClicks: 1,
            uniqueVisitors: { $size: '$uniqueVisitors' },
          },
        },
      ]),
      this.conversionModel.aggregate([
        { $match: conversionMatch },
        {
          $group: {
            _id: null,
            conversions: {
              $sum: { $cond: [{ $in: ['$status', validConversionStatuses] }, 1, 0] },
            },
            allConversions: { $sum: 1 },
            totalRevenueDT: {
              $sum: { $cond: [{ $in: ['$status', validConversionStatuses] }, { $ifNull: ['$amountDT', 0] }, 0] },
            },
            totalCreatorNetDT: {
              $sum: { $cond: [{ $in: ['$status', validConversionStatuses] }, { $ifNull: ['$creatorNetDT', 0] }, 0] },
            },
            totalCommissionDT: {
              $sum: { $cond: [{ $in: ['$status', validConversionStatuses] }, { $ifNull: ['$commissionDT', 0] }, 0] },
            },
            pendingCommissionDT: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, { $ifNull: ['$commissionDT', 0] }, 0] },
            },
            approvedCommissionDT: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, { $ifNull: ['$commissionDT', 0] }, 0] },
            },
            paidCommissionDT: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, { $ifNull: ['$commissionDT', 0] }, 0] },
            },
            reversedCommissionDT: {
              $sum: { $cond: [{ $eq: ['$status', 'reversed'] }, { $ifNull: ['$commissionDT', 0] }, 0] },
            },
            pendingConversions: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            approvedConversions: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            paidConversions: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
            reversedConversions: { $sum: { $cond: [{ $eq: ['$status', 'reversed'] }, 1, 0] } },
            averageLagHours: { $avg: '$conversionLagHours' },
          },
        },
      ]),
      this.partnerModel.aggregate([
        { $match: partnerMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.linkModel.countDocuments(linkMatch),
      this.buildClickTimeSeries(clickMatch, interval),
      this.buildConversionTimeSeries(conversionMatch, interval, validConversionStatuses),
      this.aggregateClicksBy(clickMatch, '$partnerUserId', limit),
      this.aggregateConversionsBy(conversionMatch, '$partnerUserId', limit, validConversionStatuses),
      this.aggregateClicksBy(clickMatch, '$linkCode', limit),
      this.aggregateConversionsBy(conversionMatch, '$linkCode', limit, validConversionStatuses),
      this.aggregateClicksBy(clickMatch, '$sourceChannel', limit),
      this.aggregateConversionsBy(conversionMatch, '$sourceChannel', limit, validConversionStatuses),
      this.aggregateClicksBy(clickMatch, '$deviceType', limit),
      this.aggregateConversionsBy(conversionMatch, '$deviceType', limit, validConversionStatuses),
      this.aggregateClicksBy(clickMatch, '$targetContentType', limit),
      this.aggregateConversionsBy(conversionMatch, '$contentType', limit, validConversionStatuses),
      this.linkModel.find(linkMatch).sort({ createdAt: -1 }).limit(limit).lean(),
      this.conversionModel
        .find({ ...conversionMatch, status: 'pending' })
        .sort({ holdUntil: 1 })
        .limit(8)
        .lean(),
    ]);

    const clickSummary = clickSummaryRows[0] || { clicks: 0, uniqueVisitors: 0, botClicks: 0 };
    const conversionSummary = conversionSummaryRows[0] || {};
    const partnerStatus = this.rowsToCountMap(partnerStatusRows);
    const activePrograms = programs.filter((program: any) => program.status === 'active').length;
    const primaryProgram = programs.find((program: any) => program.status === 'active') || programs[0];

    const baseSummary = {
      clicks: Number(clickSummary.clicks || 0),
      uniqueVisitors: Number(clickSummary.uniqueVisitors || 0),
      botClicks: Number(clickSummary.botClicks || 0),
      conversions: Number(conversionSummary.conversions || 0),
      allConversions: Number(conversionSummary.allConversions || 0),
      totalRevenueDT: this.roundCurrency(conversionSummary.totalRevenueDT || 0),
      totalCreatorNetDT: this.roundCurrency(conversionSummary.totalCreatorNetDT || 0),
      totalCommissionDT: this.roundCurrency(conversionSummary.totalCommissionDT || 0),
      pendingCommissionDT: this.roundCurrency(conversionSummary.pendingCommissionDT || 0),
      approvedCommissionDT: this.roundCurrency(conversionSummary.approvedCommissionDT || 0),
      paidCommissionDT: this.roundCurrency(conversionSummary.paidCommissionDT || 0),
      reversedCommissionDT: this.roundCurrency(conversionSummary.reversedCommissionDT || 0),
      pendingConversions: Number(conversionSummary.pendingConversions || 0),
      approvedConversions: Number(conversionSummary.approvedConversions || 0),
      paidConversions: Number(conversionSummary.paidConversions || 0),
      reversedConversions: Number(conversionSummary.reversedConversions || 0),
      programCount: programs.length,
      activeProgramCount: activePrograms,
      partnerCount: Object.values(partnerStatus).reduce((sum: number, count: any) => sum + Number(count || 0), 0),
      activePartnerCount: Number(partnerStatus.approved || 0),
      pendingPartnerCount: Number(partnerStatus.pending || 0),
      linkCount,
      averageLagHours: this.roundNumber(conversionSummary.averageLagHours || 0, 1),
    };

    const summary = {
      ...baseSummary,
      conversionRatePct: this.toPercent(baseSummary.conversions, baseSummary.clicks),
      visitorConversionRatePct: this.toPercent(baseSummary.conversions, baseSummary.uniqueVisitors),
      revenuePerClickDT: this.roundCurrency(baseSummary.totalRevenueDT / Math.max(baseSummary.clicks, 1)),
      commissionPerClickDT: this.roundCurrency(baseSummary.totalCommissionDT / Math.max(baseSummary.clicks, 1)),
      averageOrderDT: this.roundCurrency(baseSummary.totalRevenueDT / Math.max(baseSummary.conversions, 1)),
      averageCommissionDT: this.roundCurrency(baseSummary.totalCommissionDT / Math.max(baseSummary.conversions, 1)),
      approvalRatePct: this.toPercent(baseSummary.approvedConversions + baseSummary.paidConversions, baseSummary.conversions),
      reversalRatePct: this.toPercent(baseSummary.reversedConversions, baseSummary.allConversions),
    };

    const partnerLeaderboard = await this.enrichPartnerLeaderboard(
      this.mergeDimensionRows(clicksByPartner, conversionsByPartner, 'partnerUserId'),
      limit,
    );
    const linkLeaderboard = await this.enrichLinkLeaderboard(
      this.mergeDimensionRows(clicksByLink, conversionsByLink, 'linkCode'),
      limit,
    );
    const sourceBreakdown = this.mergeDimensionRows(clicksBySource, conversionsBySource, 'source');
    const deviceBreakdown = this.mergeDimensionRows(clicksByDevice, conversionsByDevice, 'device');
    const contentBreakdown = this.mergeDimensionRows(clicksByContent, conversionsByContent, 'contentType');
    const timeSeries = this.mergeTimeSeries(clickSeriesRows, conversionSeriesRows);

    const variables = this.buildAffiliateMarketingVariables({
      creator,
      programs,
      primaryProgram,
      summary,
      partnerLeaderboard,
      linkLeaderboard,
      sourceBreakdown,
      nextReleases,
    });
    const templates = includeTemplates ? this.buildAffiliateTemplatePayload(variables) : [];
    const mergeFields = this.buildAffiliateMergeFields(variables);
    const insights = this.buildAffiliateInsights({
      summary,
      programs,
      partnerLeaderboard,
      linkLeaderboard,
      sourceBreakdown,
    });

    return {
      generatedAt: new Date().toISOString(),
      query: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        interval,
        communityId: query.communityId,
        programId: query.programId,
        partnerUserId: query.partnerUserId,
      },
      summary,
      programs: programs.map((program: any) => ({
        id: String(program._id),
        name: program.name || this.programLabel(program),
        scopeType: program.scopeType,
        scopeContentType: program.scopeContentType,
        scopeContentId: program.scopeContentId,
        communityId: program.communityId ? String(program.communityId) : undefined,
        commissionPercent: program.commissionPercent,
        cookieWindowDays: program.cookieWindowDays,
        holdDays: program.holdDays,
        attributionModel: program.attributionModel || 'last_click',
        autoApprovePartners: Boolean(program.autoApprovePartners),
        status: program.status,
      })),
      funnels: this.buildAffiliateFunnels(summary),
      timeSeries,
      leaderboards: {
        partners: partnerLeaderboard,
        links: linkLeaderboard,
      },
      breakdowns: {
        sources: sourceBreakdown,
        devices: deviceBreakdown,
        contentTypes: contentBreakdown,
      },
      payoutHealth: {
        pendingCommissionDT: summary.pendingCommissionDT,
        approvedCommissionDT: summary.approvedCommissionDT,
        paidCommissionDT: summary.paidCommissionDT,
        reversedCommissionDT: summary.reversedCommissionDT,
        pendingConversions: summary.pendingConversions,
        approvedConversions: summary.approvedConversions,
        nextReleases: nextReleases.map((conversion: any) => ({
          conversionId: String(conversion._id),
          partnerUserId: String(conversion.partnerUserId),
          commissionDT: this.roundCurrency(conversion.commissionDT || 0),
          holdUntil: conversion.holdUntil,
          contentType: conversion.contentType,
          contentId: conversion.contentId,
        })),
      },
      linkBuilder: this.buildAffiliateLinkBuilderData(programs, partnerLeaderboard, recentLinks),
      mergeFields,
      templates,
      insights,
    };
  }

  private resolveMarketingDateRange(query: AffiliateMarketingQueryDto): { from: Date; to: Date } {
    const to = query.to ? new Date(query.to) : new Date();
    const fallbackDays = this.clampInt(query.days, 30, 1, 365);
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - (fallbackDays - 1) * 24 * 60 * 60 * 1000);
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  private clampInt(value: any, fallback: number, min: number, max: number): number {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(Math.max(parsed, min), max);
  }

  private roundCurrency(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }

  private roundNumber(value: number, decimals = 2): number {
    const factor = 10 ** decimals;
    return Math.round((Number(value || 0) + Number.EPSILON) * factor) / factor;
  }

  private toPercent(part: number, total: number): number {
    if (!total) return 0;
    return this.roundNumber((part / total) * 100, 2);
  }

  private rowsToCountMap(rows: Array<{ _id: string; count: number }>): Record<string, number> {
    return rows.reduce((acc, row) => {
      acc[row._id || 'unknown'] = Number(row.count || 0);
      return acc;
    }, {} as Record<string, number>);
  }

  private bucketFormat(interval: 'daily' | 'weekly' | 'monthly'): string {
    if (interval === 'monthly') return '%Y-%m';
    if (interval === 'weekly') return '%G-W%V';
    return '%Y-%m-%d';
  }

  private buildClickTimeSeries(match: any, interval: 'daily' | 'weekly' | 'monthly'): Promise<any[]> {
    return this.clickModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: this.bucketFormat(interval), date: '$createdAt', timezone: 'Africa/Tunis' } },
          clicks: { $sum: 1 },
          uniqueVisitors: {
            $addToSet: {
              $concat: [
                { $ifNull: ['$ipHash', '$clickId'] },
                ':',
                { $ifNull: ['$userAgentHash', 'unknown'] },
              ],
            },
          },
        },
      },
      { $project: { bucket: '$_id', clicks: 1, uniqueVisitors: { $size: '$uniqueVisitors' }, _id: 0 } },
      { $sort: { bucket: 1 } },
    ]);
  }

  private buildConversionTimeSeries(
    match: any,
    interval: 'daily' | 'weekly' | 'monthly',
    validStatuses: string[],
  ): Promise<any[]> {
    return this.conversionModel.aggregate([
      { $match: { ...match, status: { $in: validStatuses } } },
      {
        $group: {
          _id: { $dateToString: { format: this.bucketFormat(interval), date: '$createdAt', timezone: 'Africa/Tunis' } },
          conversions: { $sum: 1 },
          revenueDT: { $sum: { $ifNull: ['$amountDT', 0] } },
          commissionDT: { $sum: { $ifNull: ['$commissionDT', 0] } },
        },
      },
      { $project: { bucket: '$_id', conversions: 1, revenueDT: 1, commissionDT: 1, _id: 0 } },
      { $sort: { bucket: 1 } },
    ]);
  }

  private aggregateClicksBy(match: any, field: string, limit: number): Promise<any[]> {
    return this.clickModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $ifNull: [field, 'unknown'] },
          clicks: { $sum: 1 },
          uniqueVisitors: {
            $addToSet: {
              $concat: [
                { $ifNull: ['$ipHash', '$clickId'] },
                ':',
                { $ifNull: ['$userAgentHash', 'unknown'] },
              ],
            },
          },
        },
      },
      { $project: { _id: 1, clicks: 1, uniqueVisitors: { $size: '$uniqueVisitors' } } },
      { $sort: { clicks: -1 } },
      { $limit: limit },
    ]);
  }

  private aggregateConversionsBy(match: any, field: string, limit: number, validStatuses: string[]): Promise<any[]> {
    return this.conversionModel.aggregate([
      { $match: { ...match, status: { $in: validStatuses } } },
      {
        $group: {
          _id: { $ifNull: [field, 'unknown'] },
          conversions: { $sum: 1 },
          revenueDT: { $sum: { $ifNull: ['$amountDT', 0] } },
          commissionDT: { $sum: { $ifNull: ['$commissionDT', 0] } },
        },
      },
      { $sort: { commissionDT: -1, revenueDT: -1, conversions: -1 } },
      { $limit: limit },
    ]);
  }

  private mergeDimensionRows(clickRows: any[], conversionRows: any[], idKey: string): any[] {
    const rows = new Map<string, any>();
    for (const row of clickRows || []) {
      const key = String(row._id ?? 'unknown');
      rows.set(key, {
        [idKey]: key,
        label: key,
        clicks: Number(row.clicks || 0),
        uniqueVisitors: Number(row.uniqueVisitors || 0),
        conversions: 0,
        revenueDT: 0,
        commissionDT: 0,
      });
    }
    for (const row of conversionRows || []) {
      const key = String(row._id ?? 'unknown');
      const current = rows.get(key) || {
        [idKey]: key,
        label: key,
        clicks: 0,
        uniqueVisitors: 0,
        conversions: 0,
        revenueDT: 0,
        commissionDT: 0,
      };
      current.conversions = Number(row.conversions || 0);
      current.revenueDT = this.roundCurrency(row.revenueDT || 0);
      current.commissionDT = this.roundCurrency(row.commissionDT || 0);
      rows.set(key, current);
    }
    return Array.from(rows.values())
      .map((row) => ({
        ...row,
        conversionRatePct: this.toPercent(row.conversions, row.clicks),
        revenuePerClickDT: this.roundCurrency(row.revenueDT / Math.max(row.clicks, 1)),
        commissionPerClickDT: this.roundCurrency(row.commissionDT / Math.max(row.clicks, 1)),
      }))
      .sort((a, b) => (b.commissionDT - a.commissionDT) || (b.conversions - a.conversions) || (b.clicks - a.clicks));
  }

  private mergeTimeSeries(clickRows: any[], conversionRows: any[]): any[] {
    const rows = new Map<string, any>();
    for (const row of clickRows || []) {
      rows.set(row.bucket, {
        bucket: row.bucket,
        clicks: Number(row.clicks || 0),
        uniqueVisitors: Number(row.uniqueVisitors || 0),
        conversions: 0,
        revenueDT: 0,
        commissionDT: 0,
      });
    }
    for (const row of conversionRows || []) {
      const current = rows.get(row.bucket) || {
        bucket: row.bucket,
        clicks: 0,
        uniqueVisitors: 0,
        conversions: 0,
        revenueDT: 0,
        commissionDT: 0,
      };
      current.conversions = Number(row.conversions || 0);
      current.revenueDT = this.roundCurrency(row.revenueDT || 0);
      current.commissionDT = this.roundCurrency(row.commissionDT || 0);
      rows.set(row.bucket, current);
    }
    return Array.from(rows.values())
      .map((row) => ({ ...row, conversionRatePct: this.toPercent(row.conversions, row.clicks) }))
      .sort((a, b) => String(a.bucket).localeCompare(String(b.bucket)));
  }

  private async enrichPartnerLeaderboard(rows: any[], limit: number): Promise<any[]> {
    const ids = rows
      .map((row) => row.partnerUserId)
      .filter((id) => Types.ObjectId.isValid(id))
      .slice(0, limit)
      .map((id) => new Types.ObjectId(id));
    const users = ids.length
      ? await this.userModel.find({ _id: { $in: ids } }).select('name email username avatar avatarUrl profilePicture').lean()
      : [];
    const userMap = new Map(users.map((user: any) => [String(user._id), user]));

    return rows.slice(0, limit).map((row) => {
      const user = userMap.get(row.partnerUserId);
      return {
        ...row,
        partnerUserId: row.partnerUserId,
        name: user?.name || user?.username || row.label,
        email: user?.email,
        avatar: user?.avatar || user?.avatarUrl || user?.profilePicture,
      };
    });
  }

  private async enrichLinkLeaderboard(rows: any[], limit: number): Promise<any[]> {
    const codes = rows.map((row) => row.linkCode).filter(Boolean).slice(0, limit);
    const links = codes.length ? await this.linkModel.find({ code: { $in: codes } }).lean() : [];
    const linkMap = new Map(links.map((link: any) => [String(link.code), link]));
    const baseUrl = (process.env.FRONTEND_URL || 'https://chabaqa.io').replace(/\/+$/, '');

    return rows.slice(0, limit).map((row) => {
      const link = linkMap.get(row.linkCode);
      return {
        ...row,
        label: link?.label || link?.campaignName || link?.targetPath || row.linkCode,
        code: row.linkCode,
        targetPath: link?.targetPath,
        targetContentType: link?.targetContentType,
        targetContentId: link?.targetContentId,
        campaignName: link?.campaignName,
        utmSource: link?.utmSource,
        utmMedium: link?.utmMedium,
        utmCampaign: link?.utmCampaign,
        fullUrl: row.linkCode && row.linkCode !== 'unknown' ? `${baseUrl}/r/${row.linkCode}` : undefined,
      };
    });
  }

  private programLabel(program: any): string {
    if (program?.name) return program.name;
    const scope = String(program?.scopeType || 'Affiliate');
    return `${scope.charAt(0).toUpperCase()}${scope.slice(1)} Program`;
  }

  private buildAffiliateFunnels(summary: any): any[] {
    const approvedOrPaid = Number(summary.approvedConversions || 0) + Number(summary.paidConversions || 0);
    return [
      { key: 'clicks', label: 'Tracked clicks', value: summary.clicks, rateFromPreviousPct: 100 },
      {
        key: 'unique_visitors',
        label: 'Unique visitors',
        value: summary.uniqueVisitors,
        rateFromPreviousPct: this.toPercent(summary.uniqueVisitors, summary.clicks),
      },
      {
        key: 'conversions',
        label: 'Conversions',
        value: summary.conversions,
        rateFromPreviousPct: this.toPercent(summary.conversions, Math.max(summary.uniqueVisitors, summary.clicks)),
      },
      {
        key: 'approved_or_paid',
        label: 'Approved or paid',
        value: approvedOrPaid,
        rateFromPreviousPct: this.toPercent(approvedOrPaid, summary.conversions),
      },
      {
        key: 'paid',
        label: 'Paid commission',
        value: summary.paidConversions,
        rateFromPreviousPct: this.toPercent(summary.paidConversions, approvedOrPaid),
      },
    ];
  }

  private buildAffiliateMarketingVariables(input: {
    creator: any;
    programs: any[];
    primaryProgram: any;
    summary: any;
    partnerLeaderboard: any[];
    linkLeaderboard: any[];
    sourceBreakdown: any[];
    nextReleases: any[];
  }): Record<string, any> {
    const topPartner = input.partnerLeaderboard[0] || {};
    const topLink = input.linkLeaderboard[0] || {};
    const bestSource = input.sourceBreakdown[0] || {};
    const primaryProgram = input.primaryProgram || {};
    const nextRelease = input.nextReleases?.[0];
    return {
      creatorName: input.creator?.name || input.creator?.username || 'Creator',
      creatorEmail: input.creator?.email || '',
      programName: this.programLabel(primaryProgram),
      programCount: input.summary.programCount,
      activeProgramCount: input.summary.activeProgramCount,
      primaryCommissionPercent: primaryProgram.commissionPercent ?? 0,
      cookieWindowDays: primaryProgram.cookieWindowDays ?? 30,
      holdDays: primaryProgram.holdDays ?? 14,
      attributionModel: primaryProgram.attributionModel || 'last_click',
      partnerName: topPartner.name || 'Partner',
      partnerEmail: topPartner.email || '',
      topPartnerName: topPartner.name || 'Top partner',
      topPartnerCommissionDT: this.roundCurrency(topPartner.commissionDT || 0),
      topPartnerConversions: topPartner.conversions || 0,
      clickCount: input.summary.clicks,
      uniqueVisitorCount: input.summary.uniqueVisitors,
      conversionCount: input.summary.conversions,
      conversionRatePct: input.summary.conversionRatePct,
      totalRevenueDT: input.summary.totalRevenueDT,
      totalCommissionDT: input.summary.totalCommissionDT,
      pendingCommissionDT: input.summary.pendingCommissionDT,
      approvedCommissionDT: input.summary.approvedCommissionDT,
      paidCommissionDT: input.summary.paidCommissionDT,
      bestSourceLabel: bestSource.label || bestSource.source || 'direct',
      bestTargetLabel: topLink.label || topLink.targetPath || 'your best offer',
      affiliateCode: topLink.code || '',
      affiliateLink: topLink.fullUrl || '',
      utmCampaign: topLink.utmCampaign || topLink.campaignName || 'affiliate_launch',
      targetAudienceLabel: 'students and members ready for the next step',
      nextMilestoneCommissionDT: this.roundCurrency(Math.max(100, (topPartner.commissionDT || 0) + 100)),
      nextReleaseDate: nextRelease?.holdUntil ? new Date(nextRelease.holdUntil).toISOString().slice(0, 10) : '',
    };
  }

  private buildAffiliateMergeFields(variables: Record<string, any>): any[] {
    const field = (key: string, label: string, type: string, source: string) => ({
      key,
      token: `{{${key}}}`,
      label,
      type,
      source,
      sample: variables[key] ?? '',
    });
    return [
      {
        key: 'program',
        label: 'Program',
        fields: [
          field('programName', 'Program name', 'text', 'affiliate_program'),
          field('primaryCommissionPercent', 'Commission percent', 'number', 'affiliate_program'),
          field('cookieWindowDays', 'Cookie window days', 'number', 'affiliate_program'),
          field('holdDays', 'Hold days', 'number', 'affiliate_program'),
          field('attributionModel', 'Attribution model', 'text', 'affiliate_program'),
        ],
      },
      {
        key: 'performance',
        label: 'Performance',
        fields: [
          field('clickCount', 'Clicks', 'number', 'affiliate_analytics'),
          field('uniqueVisitorCount', 'Unique visitors', 'number', 'affiliate_analytics'),
          field('conversionCount', 'Conversions', 'number', 'affiliate_analytics'),
          field('conversionRatePct', 'Conversion rate percent', 'number', 'affiliate_analytics'),
          field('totalRevenueDT', 'Revenue TND', 'currency', 'affiliate_analytics'),
          field('totalCommissionDT', 'Commission TND', 'currency', 'affiliate_analytics'),
        ],
      },
      {
        key: 'partner',
        label: 'Partner',
        fields: [
          field('partnerName', 'Partner name', 'text', 'affiliate_partner'),
          field('partnerEmail', 'Partner email', 'text', 'affiliate_partner'),
          field('topPartnerName', 'Top partner name', 'text', 'affiliate_partner'),
          field('topPartnerCommissionDT', 'Top partner commission', 'currency', 'affiliate_partner'),
          field('topPartnerConversions', 'Top partner conversions', 'number', 'affiliate_partner'),
        ],
      },
      {
        key: 'link',
        label: 'Link and Source',
        fields: [
          field('affiliateLink', 'Affiliate link', 'url', 'affiliate_link'),
          field('affiliateCode', 'Affiliate code', 'text', 'affiliate_link'),
          field('bestTargetLabel', 'Best target label', 'text', 'affiliate_link'),
          field('bestSourceLabel', 'Best source label', 'text', 'affiliate_click'),
          field('utmCampaign', 'UTM campaign', 'text', 'affiliate_link'),
        ],
      },
      {
        key: 'payout',
        label: 'Payout',
        fields: [
          field('pendingCommissionDT', 'Pending commission', 'currency', 'affiliate_conversion'),
          field('approvedCommissionDT', 'Approved commission', 'currency', 'affiliate_conversion'),
          field('paidCommissionDT', 'Paid commission', 'currency', 'affiliate_conversion'),
          field('nextReleaseDate', 'Next release date', 'date', 'affiliate_conversion'),
        ],
      },
    ];
  }

  private buildAffiliateTemplatePayload(variables: Record<string, any>): any[] {
    return AFFILIATE_MARKETING_TEMPLATES.map((template) => {
      const subject = template.subject ? renderAffiliateTemplate(template.subject, variables) : undefined;
      const content = renderAffiliateTemplate(template.content, variables);
      return {
        ...template,
        variables: extractAffiliateTemplateTokens(`${template.subject || ''}\n${template.content}`),
        renderedPreview: { subject, content },
      };
    });
  }

  private buildAffiliateLinkBuilderData(programs: any[], partners: any[], links: any[]): any {
    return {
      targetTypes: [
        { value: 'community', label: 'Community' },
        { value: 'course', label: 'Course' },
        { value: 'product', label: 'Product' },
        { value: 'event', label: 'Event' },
        { value: 'challenge', label: 'Challenge' },
        { value: 'session', label: 'Session' },
      ],
      utmPresets: [
        { label: 'Partner newsletter', utmMedium: 'email', utmSource: 'partner_newsletter' },
        { label: 'Instagram story', utmMedium: 'social', utmSource: 'instagram' },
        { label: 'TikTok bio', utmMedium: 'social', utmSource: 'tiktok' },
        { label: 'YouTube description', utmMedium: 'social', utmSource: 'youtube' },
        { label: 'Direct community share', utmMedium: 'referral', utmSource: 'community' },
      ],
      attributionModels: [
        { value: 'last_click', label: 'Last click' },
        { value: 'first_click', label: 'First click' },
      ],
      recommendedProgramId: programs.find((program: any) => program.status === 'active')?._id?.toString() || programs[0]?._id?.toString(),
      recommendedPartnerUserId: partners[0]?.partnerUserId,
      recentLinks: links.map((link: any) => ({
        id: String(link._id),
        code: link.code,
        label: link.label || link.campaignName || link.targetPath,
        targetPath: link.targetPath,
        clicks: link.clickCount || 0,
        lastClickedAt: link.lastClickedAt,
      })),
    };
  }

  private buildAffiliateInsights(input: {
    summary: any;
    programs: any[];
    partnerLeaderboard: any[];
    linkLeaderboard: any[];
    sourceBreakdown: any[];
  }): any[] {
    const insights: any[] = [];
    const activePrograms = input.programs.filter((program: any) => program.status === 'active');
    if (activePrograms.length === 0) {
      insights.push({
        severity: 'critical',
        type: 'program_setup',
        title: 'No active affiliate program',
        description: 'Activate at least one program before recruiting or generating links.',
        action: 'activate_program',
      });
    }
    if (input.summary.activePartnerCount === 0) {
      insights.push({
        severity: 'high',
        type: 'partner_supply',
        title: 'No approved partners',
        description: 'Invite and approve partners so affiliate links can start producing traffic.',
        action: 'invite_partners',
      });
    }
    if (input.summary.clicks >= 20 && input.summary.conversionRatePct < 2) {
      insights.push({
        severity: 'high',
        type: 'conversion_quality',
        title: 'Clicks are not converting yet',
        description: `Conversion rate is ${input.summary.conversionRatePct}% from ${input.summary.clicks} clicks.`,
        action: 'optimize_landing_target',
      });
    }
    const directSource = input.sourceBreakdown.find((source) => source.source === 'direct' || source.label === 'direct');
    if (directSource && input.summary.clicks > 0 && directSource.clicks / input.summary.clicks > 0.5) {
      insights.push({
        severity: 'medium',
        type: 'attribution_quality',
        title: 'Most traffic is missing source detail',
        description: 'Add UTM presets to partner links so future frontend charts can separate channels precisely.',
        action: 'add_utm_presets',
      });
    }
    if (input.summary.pendingCommissionDT > input.summary.approvedCommissionDT && input.summary.pendingCommissionDT > 0) {
      insights.push({
        severity: 'medium',
        type: 'payout_trust',
        title: 'Pending commission is building up',
        description: `${input.summary.pendingCommissionDT} TND is still in hold. Send partners a payout status update.`,
        action: 'send_payout_update',
      });
    }
    if (input.partnerLeaderboard[0]?.commissionDT > 0) {
      insights.push({
        severity: 'positive',
        type: 'scale_winner',
        title: 'Top partner is worth scaling',
        description: `${input.partnerLeaderboard[0].name || 'A partner'} generated ${input.partnerLeaderboard[0].commissionDT} TND commission.`,
        action: 'send_top_partner_boost',
      });
    }
    if (input.linkLeaderboard[0]?.conversionRatePct >= 5) {
      insights.push({
        severity: 'positive',
        type: 'winning_link',
        title: 'A link is outperforming',
        description: `${input.linkLeaderboard[0].label || input.linkLeaderboard[0].code} converts at ${input.linkLeaderboard[0].conversionRatePct}%.`,
        action: 'promote_winning_link',
      });
    }
    return insights;
  }

  private buildEmptyMarketingResponse(input: {
    creator: any;
    programs: any[];
    query: AffiliateMarketingQueryDto;
    range: { from: Date; to: Date };
    includeTemplates: boolean;
  }): any {
    const summary = {
      clicks: 0,
      uniqueVisitors: 0,
      botClicks: 0,
      conversions: 0,
      allConversions: 0,
      totalRevenueDT: 0,
      totalCreatorNetDT: 0,
      totalCommissionDT: 0,
      pendingCommissionDT: 0,
      approvedCommissionDT: 0,
      paidCommissionDT: 0,
      reversedCommissionDT: 0,
      pendingConversions: 0,
      approvedConversions: 0,
      paidConversions: 0,
      reversedConversions: 0,
      programCount: input.programs.length,
      activeProgramCount: input.programs.filter((program: any) => program.status === 'active').length,
      partnerCount: 0,
      activePartnerCount: 0,
      pendingPartnerCount: 0,
      linkCount: 0,
      averageLagHours: 0,
      conversionRatePct: 0,
      visitorConversionRatePct: 0,
      revenuePerClickDT: 0,
      commissionPerClickDT: 0,
      averageOrderDT: 0,
      averageCommissionDT: 0,
      approvalRatePct: 0,
      reversalRatePct: 0,
    };
    const variables = this.buildAffiliateMarketingVariables({
      creator: input.creator,
      programs: input.programs,
      primaryProgram: input.programs[0] || {},
      summary,
      partnerLeaderboard: [],
      linkLeaderboard: [],
      sourceBreakdown: [],
      nextReleases: [],
    });
    return {
      generatedAt: new Date().toISOString(),
      query: {
        from: input.range.from.toISOString(),
        to: input.range.to.toISOString(),
        interval: input.query.interval || 'daily',
        communityId: input.query.communityId,
        programId: input.query.programId,
        partnerUserId: input.query.partnerUserId,
      },
      summary,
      programs: input.programs,
      funnels: this.buildAffiliateFunnels(summary),
      timeSeries: [],
      leaderboards: { partners: [], links: [] },
      breakdowns: { sources: [], devices: [], contentTypes: [] },
      payoutHealth: {
        pendingCommissionDT: 0,
        approvedCommissionDT: 0,
        paidCommissionDT: 0,
        reversedCommissionDT: 0,
        pendingConversions: 0,
        approvedConversions: 0,
        nextReleases: [],
      },
      linkBuilder: this.buildAffiliateLinkBuilderData(input.programs, [], []),
      mergeFields: this.buildAffiliateMergeFields(variables),
      templates: input.includeTemplates ? this.buildAffiliateTemplatePayload(variables) : [],
      insights: this.buildAffiliateInsights({ summary, programs: input.programs, partnerLeaderboard: [], linkLeaderboard: [], sourceBreakdown: [] }),
    };
  }

  async getPartnerStats(partnerUserId: string, from?: string, to?: string): Promise<any> {
    const dateFilter: any = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);

    const matchFilter: any = { partnerUserId: new Types.ObjectId(partnerUserId) };
    if (from || to) matchFilter.createdAt = dateFilter;

    const [clicks, conversions] = await Promise.all([
      this.clickModel.countDocuments(matchFilter),
      this.conversionModel.aggregate([
        { $match: { ...matchFilter, status: { $in: ['pending', 'approved', 'paid'] } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalDT: { $sum: '$commissionDT' },
          },
        },
      ]),
    ]);

    const byStatus: Record<string, { count: number; totalDT: number }> = {};
    for (const c of conversions) {
      byStatus[c._id] = { count: c.count, totalDT: c.totalDT };
    }

    return {
      clicks,
      conversions: byStatus,
      totalConversions: Object.values(byStatus).reduce((s, v) => s + v.count, 0),
      totalCommissionDT: Object.values(byStatus).reduce((s, v) => s + v.totalDT, 0),
    };
  }
}
