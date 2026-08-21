import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { AffiliateClick, AffiliateClickDocument } from '@/domains/community/affiliate/schemas/affiliate-click.schema';
import { AffiliateLink, AffiliateLinkDocument } from '@/domains/community/affiliate/schemas/affiliate-link.schema';
import { AffiliateProgram, AffiliateProgramDocument } from '@/domains/community/affiliate/schemas/affiliate-program.schema';
import { AffiliatePartner, AffiliatePartnerDocument } from '@/domains/community/affiliate/schemas/affiliate-partner.schema';

@Injectable()
export class AffiliateAttributionService {
  private readonly logger = new Logger(AffiliateAttributionService.name);
  private readonly cookieName: string;
  private readonly ipSalt: string;

  constructor(
    @InjectModel(AffiliateClick.name) private readonly clickModel: Model<AffiliateClickDocument>,
    @InjectModel(AffiliateLink.name) private readonly linkModel: Model<AffiliateLinkDocument>,
    @InjectModel(AffiliateProgram.name) private readonly programModel: Model<AffiliateProgramDocument>,
    @InjectModel(AffiliatePartner.name) private readonly partnerModel: Model<AffiliatePartnerDocument>,
  ) {
    this.cookieName = process.env.AFFILIATE_COOKIE_NAME || 'chabaqa_aff_click';
    this.ipSalt = process.env.AFFILIATE_IP_HASH_SALT || 'default-aff-salt-change-me';
  }

  private hashValue(value: string): string {
    return crypto.createHmac('sha256', this.ipSalt).update(value).digest('hex');
  }

  private classifySourceChannel(input: {
    utmSource?: string;
    utmMedium?: string;
    referrer?: string;
  }): string {
    const source = String(input.utmSource || '').toLowerCase();
    const medium = String(input.utmMedium || '').toLowerCase();
    const referrer = String(input.referrer || '').toLowerCase();

    if (medium.includes('email') || source.includes('newsletter')) return 'email';
    if (medium.includes('paid') || medium.includes('cpc') || medium.includes('ads')) return 'paid';
    if (medium.includes('social')) return 'social';
    if (/instagram|facebook|tiktok|youtube|linkedin|twitter|x\.com/.test(source || referrer)) return 'social';
    if (/google|bing|yahoo|duckduckgo/.test(referrer)) return 'organic_search';
    if (referrer) return 'referral';
    return 'direct';
  }

  private parseUserAgent(userAgent?: string): {
    deviceType: string;
    browser: string;
    os: string;
    isBot: boolean;
  } {
    const ua = String(userAgent || '');
    const lower = ua.toLowerCase();
    const isBot = /bot|crawler|spider|preview|slurp|facebookexternalhit|whatsapp|telegram/.test(lower);
    const deviceType = isBot
      ? 'bot'
      : /ipad|tablet/.test(lower)
        ? 'tablet'
        : /mobile|iphone|android/.test(lower)
          ? 'mobile'
          : 'desktop';
    const browser = /edg\//i.test(ua)
      ? 'Edge'
      : /opr\//i.test(ua)
        ? 'Opera'
        : /chrome|crios/i.test(ua)
          ? 'Chrome'
          : /firefox|fxios/i.test(ua)
            ? 'Firefox'
            : /safari/i.test(ua)
              ? 'Safari'
              : 'Other';
    const os = /iphone|ipad|ios/i.test(ua)
      ? 'iOS'
      : /android/i.test(ua)
        ? 'Android'
        : /windows/i.test(ua)
          ? 'Windows'
          : /mac os|macintosh/i.test(ua)
            ? 'macOS'
            : /linux/i.test(ua)
              ? 'Linux'
              : 'Other';

    return { deviceType, browser, os, isBot };
  }

  /**
   * Record a click for a valid affiliate link.
   * Returns the click and resolved link/program for redirect.
   */
  async recordClick(
    code: string,
    req: {
      ip?: string;
      userAgent?: string;
      referrer?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmTerm?: string;
      utmContent?: string;
      viewerUserId?: string;
    },
  ): Promise<{
    click: AffiliateClickDocument;
    link: AffiliateLinkDocument;
    program: AffiliateProgramDocument;
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

    const clickId = uuidv4();
    const userAgentData = this.parseUserAgent(req.userAgent);
    const sourceChannel = this.classifySourceChannel({
      utmSource: req.utmSource || link.utmSource,
      utmMedium: req.utmMedium || link.utmMedium,
      referrer: req.referrer,
    });
    const click = await this.clickModel.create({
      clickId,
      programId: program._id,
      creatorId: link.creatorId || program.creatorId,
      communityId: link.communityId || program.communityId,
      partnerUserId: link.partnerUserId,
      linkCode: code,
      targetContentType: link.targetContentType,
      targetContentId: link.targetContentId,
      landingPath: link.targetPath,
      referrer: req.referrer ? req.referrer.substring(0, 500) : undefined,
      utmSource: req.utmSource || link.utmSource,
      utmMedium: req.utmMedium || link.utmMedium,
      utmCampaign: req.utmCampaign || link.utmCampaign || link.campaignName,
      utmTerm: req.utmTerm || link.utmTerm,
      utmContent: req.utmContent || link.utmContent,
      sourceChannel,
      ...userAgentData,
      ipHash: req.ip ? this.hashValue(req.ip) : undefined,
      userAgentHash: req.userAgent ? this.hashValue(req.userAgent) : undefined,
      viewerUserId: req.viewerUserId ? new Types.ObjectId(req.viewerUserId) : undefined,
    });

    await (this.linkModel as any).updateOne?.(
      { code },
      { $inc: { clickCount: 1 }, $set: { lastClickedAt: new Date() } },
    );

    return { click, link, program };
  }

  /**
   * Resolve attribution from a request (cookie or header).
   * Used during payment init to attach clickId to the order.
   */
  resolveAttributionFromRequest(req: any): { clickId?: string } {
    const cookieClickId = req.cookies?.[this.cookieName];
    const headerClickId = req.headers?.['x-aff-click'];
    const clickId = cookieClickId || headerClickId;
    return clickId ? { clickId: String(clickId) } : {};
  }

  /**
   * Get cookie configuration for the redirect endpoint.
   */
  getCookieConfig(cookieWindowDays: number): {
    name: string;
    options: {
      httpOnly: boolean;
      sameSite: 'lax';
      secure: boolean;
      maxAge: number;
      path: string;
    };
  } {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      name: this.cookieName,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        maxAge: cookieWindowDays * 24 * 60 * 60 * 1000,
        path: '/',
      },
    };
  }

  /**
   * Load click from DB by clickId.
   */
  async getClickById(clickId: string): Promise<AffiliateClickDocument | null> {
    return this.clickModel.findOne({ clickId });
  }
}
