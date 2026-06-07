import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AnalyticsDaily, AnalyticsDailyDocument } from '@/infrastructure/database/schemas/analytics/analytics-daily.schema';
import { AnalyticsRetention, AnalyticsRetentionDocument } from '@/infrastructure/database/schemas/analytics/analytics-retention.schema';
import { AnalyticsWeeklyReport, AnalyticsWeeklyReportDocument } from '@/infrastructure/database/schemas/analytics/analytics-weekly-report.schema';
import { SubscriptionService } from '@/domains/commerce/subscription/subscription.service';
import { PlanTier } from '@/infrastructure/database/schemas/commerce/plan.schema';
import { TrackingAction, TrackingActionType } from '@/infrastructure/database/schemas/learning/content-tracking.schema';
import { Cours, CoursSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Ga4ReportingService } from '@/domains/analytics/ga4/ga4-reporting.service';
import { CacheService } from '@/infrastructure/cache/cache.service';
import { PolicyService } from '@/shared/services/policy.service';

type AnalyticsChartContentType = 'course' | 'challenge' | 'session' | 'event' | 'product' | 'post';

type AnalyticsChartVisualization =
  | 'line'
  | 'area'
  | 'bar'
  | 'stacked_bar'
  | 'donut'
  | 'funnel'
  | 'heatmap'
  | 'table';

interface AnalyticsChartPayload {
  id: string;
  title: string;
  description: string;
  visualization: AnalyticsChartVisualization;
  metrics: string[];
  data: any[];
  xKey?: string;
  yKeys?: string[];
  valueKey?: string;
  source: string;
  precision: 'exact' | 'rollup' | 'hybrid' | 'derived';
  unit?: string;
}

interface AnalyticsChartContentMeta {
  title?: string;
  communityId?: string;
  currency?: string;
  price?: number;
  trackingIds?: string[];
  orderIds?: string[];
  enrollmentCourseObjectId?: Types.ObjectId;
}

interface AnalyticsDashboardSeriesPoint {
  date: string;
  revenue: number;
  members: number;
  enrollments: number;
  interactions: number;
  views: number;
  completions: number;
}


@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private cache: Map<string, { data: any; expiresAt: number }>; // simple TTL cache
  private readonly creatorObjectIdCache = new Map<string, Types.ObjectId>();
  private readonly analyticsRedisPrefix = 'creator-analytics';
  private readonly defaultCacheTtlMs = 60 * 1000;

  constructor(
    @InjectModel(AnalyticsDaily.name) private readonly dailyModel: Model<AnalyticsDailyDocument>,
    @InjectModel(AnalyticsRetention.name) private readonly retentionModel: Model<AnalyticsRetentionDocument>,
    @InjectModel(AnalyticsWeeklyReport.name) private readonly weeklyReportModel: Model<AnalyticsWeeklyReportDocument>,
    private readonly subscriptionService: SubscriptionService,
    @InjectConnection() private readonly dbConnection: Connection,
    private readonly ga4ReportingService: Ga4ReportingService,
    private readonly cacheService: CacheService,
    private readonly policyService: PolicyService,
  ) {
    this.cache = new Map();
  }
  /**
   * Clamp the "from" date so it does not exceed the plan's lookback window.
   * When PLAN_ENFORCEMENT_MODE=false the full range is returned unchanged.
   */
  private async clampDateRangeForPlan(
    creatorId: string,
    from: Date,
    to: Date,
  ): Promise<{ from: Date; to: Date; lookbackDays: number }> {
    const lookbackDays = await this.policyService.getAnalyticsLookbackDays(creatorId);
    const cutoff = new Date(to.getTime() - lookbackDays * 24 * 3600 * 1000);
    const effectiveFrom = from < cutoff ? cutoff : from;
    return { from: effectiveFrom, to, lookbackDays };
  }


  private cacheKey(userId: string, from: string, to: string, scope: string) {
    return `${userId}:${from}:${to}:${scope}`;
  }

  private getRedisCacheKey(key: string): string {
    return `${this.analyticsRedisPrefix}:${key}`;
  }

  private setCache(key: string, value: any, ttlMs = this.defaultCacheTtlMs) {
    this.cache.set(key, { data: value, expiresAt: Date.now() + ttlMs });
    const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000));
    void this.cacheService.set(this.getRedisCacheKey(key), value, ttlSeconds);
  }

  private async getCache<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (entry) {
      if (Date.now() <= entry.expiresAt) {
        return entry.data as T;
      }
      this.cache.delete(key);
    }

    const redisValue = await this.cacheService.get<T>(this.getRedisCacheKey(key));
    if (redisValue !== undefined) {
      // Keep a short in-process hot cache layer to avoid repetitive deserialization.
      this.cache.set(key, { data: redisValue, expiresAt: Date.now() + this.defaultCacheTtlMs });
      return redisValue;
    }

    return null;
  }

  private async invalidateCreatorCache(creatorId: string): Promise<void> {
    const localPrefix = `${creatorId}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(localPrefix)) {
        this.cache.delete(key);
      }
    }

    const pattern = `${this.analyticsRedisPrefix}:${creatorId}:*`;
    const deleted = await this.cacheService.deletePattern(pattern);
    if (deleted > 0) {
      this.logger.debug(`Invalidated ${deleted} creator analytics cache key(s) for ${creatorId}`);
    }
  }

  private getCreatorObjectId(creatorId: string): Types.ObjectId {
    const cached = this.creatorObjectIdCache.get(creatorId);
    if (cached) return cached;
    const objectId = new Types.ObjectId(creatorId);
    this.creatorObjectIdCache.set(creatorId, objectId);
    return objectId;
  }

  private buildLookupCommunityMatch(path: string, values: Array<string | Types.ObjectId>) {
    return { [path]: { $in: values } };
  }

  private setDailyCommunityFilter(match: Record<string, any>, communityIdStrings: string[]) {
    match.communityId = { $in: communityIdStrings };
  }

  private buildOrderContentCommunityLookup(collection: string, contentType: string, alias: string) {
    return {
      $lookup: {
        from: collection,
        let: { orderContentId: '$contentId', orderContentType: '$contentType' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$$orderContentType', contentType] },
                  {
                    $or: [
                      { $eq: ['$id', '$$orderContentId'] },
                      { $eq: [{ $toString: '$_id' }, '$$orderContentId'] },
                    ],
                  },
                ],
              },
            },
          },
          { $project: { _id: 0, communityId: 1 } },
          { $limit: 1 },
        ],
        as: alias,
      },
    } as any;
  }

  private buildAnalyticsQualityMeta(params: {
    from: Date;
    to: Date;
    source: 'ga4' | 'mongo_rollup' | 'tracking_fallback';
    events: number;
    uniqueUsers?: number;
    trend?: any[];
  }) {
    const events = Math.max(0, Math.floor(Number(params.events || 0)));
    const uniqueUsers = Math.max(0, Math.floor(Number(params.uniqueUsers || 0)));
    const sampleLabel = events < 30 ? 'Low sample' : events < 250 ? 'Directional' : 'Reliable';
    const maxTrendDate = (params.trend || [])
      .map((row) => row?.date)
      .filter(Boolean)
      .sort()
      .at(-1);

    return {
      generatedAt: new Date().toISOString(),
      dataAsOf: maxTrendDate || params.to.toISOString(),
      range: { from: params.from.toISOString(), to: params.to.toISOString() },
      source: params.source,
      rollupMaxDate: maxTrendDate || null,
      sample: {
        events,
        uniqueUsers,
        label: sampleLabel,
      },
    };
  }

  private async aggregateCreatorRevenue(
    creatorId: string,
    from: Date,
    to: Date,
    communityScope: { hasFilter: boolean; lookupCommunityValues: Array<string | Types.ObjectId> },
    extraMatch?: Record<string, any>,
  ): Promise<{ total: number; count: number }> {
    const ordersCollection = this.dbConnection.db?.collection('orders');
    if (!ordersCollection) return { total: 0, count: 0 };

    const match: any = {
      creatorId: this.getCreatorObjectId(creatorId),
      status: 'paid',
      createdAt: { $gte: from, $lte: to },
      ...(extraMatch || {}),
    };

    const revenueGroupStages: any[] = [
      {
        $group: {
          _id: null,
          total: { $sum: '$creatorNetDT' },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, total: 1, count: 1 } },
    ];

    if (!communityScope.hasFilter) {
      const rows = await ordersCollection.aggregate([{ $match: match }, ...revenueGroupStages]).toArray();
      return {
        total: Number(rows?.[0]?.total ?? 0) || 0,
        count: Number(rows?.[0]?.count ?? 0) || 0,
      };
    }

    const resolvedCommunityIdExpr = {
      $ifNull: [
        '$communityId',
        {
          $ifNull: [
            { $cond: [{ $eq: ['$contentType', 'community'] }, '$contentId', null] },
            {
              $ifNull: [
                { $arrayElemAt: ['$courseDoc.communityId', 0] },
                {
                  $ifNull: [
                    { $arrayElemAt: ['$challengeDoc.communityId', 0] },
                    {
                      $ifNull: [
                        { $arrayElemAt: ['$sessionDoc.communityId', 0] },
                        {
                          $ifNull: [
                            { $arrayElemAt: ['$eventDoc.communityId', 0] },
                            { $arrayElemAt: ['$productDoc.communityId', 0] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const rows = await ordersCollection
      .aggregate([
        { $match: match },
        this.buildOrderContentCommunityLookup('cours', 'course', 'courseDoc'),
        this.buildOrderContentCommunityLookup('challenges', 'challenge', 'challengeDoc'),
        this.buildOrderContentCommunityLookup('sessions', 'session', 'sessionDoc'),
        this.buildOrderContentCommunityLookup('events', 'event', 'eventDoc'),
        this.buildOrderContentCommunityLookup('products', 'product', 'productDoc'),
        { $addFields: { resolvedCommunityId: resolvedCommunityIdExpr } },
        { $match: { resolvedCommunityId: { $in: communityScope.lookupCommunityValues } } },
        ...revenueGroupStages,
      ])
      .toArray();

    return {
      total: Number(rows?.[0]?.total ?? 0) || 0,
      count: Number(rows?.[0]?.count ?? 0) || 0,
    };
  }

  private async resolveCommunityScope(
    creatorId: string,
    communityId?: string,
    communitySlug?: string,
  ): Promise<{
    hasFilter: boolean;
    cacheKeyPart: string;
    communityIdStrings: string[];
    lookupCommunityValues: Array<string | Types.ObjectId>;
    ga4CommunityId?: string;
  }> {
    const candidate = (communityId || communitySlug || '').trim();
    if (!candidate) {
      return {
        hasFilter: false,
        cacheKeyPart: 'all',
        communityIdStrings: [],
        lookupCommunityValues: [],
      };
    }

    const creatorObjectId = this.getCreatorObjectId(creatorId);
    const communitiesCollection = this.dbConnection.db?.collection('communities');
    if (!communitiesCollection) {
      throw new ForbiddenException('Community analytics are temporarily unavailable.');
    }

    const ors: Record<string, any>[] = [{ slug: candidate }, { id: candidate }];
    if (Types.ObjectId.isValid(candidate)) {
      ors.push({ _id: new Types.ObjectId(candidate) });
    }

    const community = await communitiesCollection.findOne(
      { createur: creatorObjectId, $or: ors },
      { projection: { _id: 1, slug: 1, id: 1 } },
    );

    if (!community?._id) {
      throw new ForbiddenException('You do not have access to this community analytics.');
    }

    const stringIds = new Set<string>();
    stringIds.add(community._id.toString());

    if (typeof community.slug === 'string' && community.slug.trim()) {
      stringIds.add(community.slug.trim());
    }
    if (typeof community.id === 'string' && community.id.trim()) {
      stringIds.add(community.id.trim());
    }
    if (candidate) {
      stringIds.add(candidate);
    }

    const communityIdStrings = Array.from(stringIds);
    const lookupCommunityValues: Array<string | Types.ObjectId> = [
      ...communityIdStrings,
      community._id as Types.ObjectId,
    ];

    return {
      hasFilter: true,
      cacheKeyPart: community._id.toString(),
      communityIdStrings,
      lookupCommunityValues,
      ga4CommunityId: community._id.toString(),
    };
  }

  async getCommunities(creatorId: string, from: Date, to: Date) {
    const key = this.cacheKey(creatorId, from.toISOString(), to.toISOString(), 'communities');
    const cached = await this.getCache<any>(key);
    if (cached) return cached;

    // Get communities analytics
    const communities = await this.dbConnection.db?.collection('communities').find({
      createur: new Types.ObjectId(creatorId),
      createdAt: { $gte: from, $lte: to }
    }).toArray() || [];

    const result = {
      total: communities.length,
      active: communities.filter(c => c.isActive).length,
      members: communities.reduce((sum, c) => sum + (c.membersCount || 0), 0),
      averageRating: communities.reduce((sum, c) => sum + (c.averageRating || 0), 0) / communities.length || 0,
      categories: [...new Set(communities.map(c => c.category))],
      communities: communities.map(c => ({
        id: c._id,
        name: c.name,
        members: c.membersCount || 0,
        rating: c.averageRating || 0,
        category: c.category,
        createdAt: c.createdAt
      }))
    };

    this.setCache(key, result);
    return result;
  }

  async getOverview(creatorId: string, from: Date, to: Date, plan?: PlanTier, communityId?: string, communitySlug?: string) {
    if (!plan) {
      const sub = await this.subscriptionService.getMySubscription(creatorId);
      plan = (sub?.plan as PlanTier) || PlanTier.STARTER;
    }
    // Clamp date range to plan lookback window
    const clamped = await this.clampDateRangeForPlan(creatorId, from, to);
    from = clamped.from;
    to = clamped.to;
    const communityScope = await this.resolveCommunityScope(creatorId, communityId, communitySlug);
    const key = this.cacheKey(creatorId, from.toISOString(), to.toISOString(), `overview:${communityScope.cacheKeyPart}`);
    const cached = await this.getCache<any>(key);
    if (cached) return this.shapeOverview(cached, plan);

    const match = {
      creatorId: this.getCreatorObjectId(creatorId),
      date: { $gte: from, $lte: to },
    } as any;

    if (communityScope.hasFilter) {
      this.setDailyCommunityFilter(match, communityScope.communityIdStrings);
    }

    const chapterIdExpr = { $ifNull: ['$metadata.chapterId', ''] };
    const isCourseCompleteActionExpr = {
      $and: [
        { $eq: ['$actionType', TrackingActionType.COMPLETE] },
        { $eq: [chapterIdExpr, ''] },
      ],
    };
    const isChapterCompleteActionExpr = {
      $or: [
        { $eq: ['$actionType', TrackingActionType.CHAPTER_COMPLETE] },
        {
          $and: [
            { $eq: ['$actionType', TrackingActionType.COMPLETE] },
            { $ne: [chapterIdExpr, ''] },
          ],
        },
      ],
    };

    // Try GA4 first for interaction counts
    let ga4Totals: any = null;
    try {
      const ga4Counts = await this.ga4ReportingService.getCreatorEventCounts(
        creatorId,
        from.toISOString().slice(0, 10),
        to.toISOString().slice(0, 10),
        communityScope.ga4CommunityId
      );
      if (ga4Counts) {
        ga4Totals = {
          ...ga4Counts,
          watchTime: 0 // Will be merged from Mongo
        };
      }
    } catch (e) {
      // Ignore GA4 errors
    }

    let totalsAgg = await this.dailyModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          views: { $sum: '$views' },
          starts: { $sum: '$starts' },
          completes: { $sum: '$completes' },
          chapterCompletes: { $sum: '$chapterCompletes' },
          likes: { $sum: '$likes' },
          shares: { $sum: '$shares' },
          downloads: { $sum: '$downloads' },
          bookmarks: { $sum: '$bookmarks' },
          watchTime: { $sum: '$watchTime' },
          ratingsCount: { $sum: '$ratingsCount' },
        },
      },
      { $project: { _id: 0 } },
    ]);

    // If no rollups exist yet for this creator, backfill from trackingactions once
    if (!totalsAgg.length && !ga4Totals) {
      await this.backfillForCreator(creatorId, 90);
      totalsAgg = await this.dailyModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            views: { $sum: '$views' },
            starts: { $sum: '$starts' },
            completes: { $sum: '$completes' },
            chapterCompletes: { $sum: '$chapterCompletes' },
            likes: { $sum: '$likes' },
            shares: { $sum: '$shares' },
            downloads: { $sum: '$downloads' },
            bookmarks: { $sum: '$bookmarks' },
            watchTime: { $sum: '$watchTime' },
            ratingsCount: { $sum: '$ratingsCount' },
          },
        },
        { $project: { _id: 0 } },
      ]);
    }

    const mongoTotals = totalsAgg[0] || {
      views: 0,
      starts: 0,
      completes: 0,
      chapterCompletes: 0,
      likes: 0,
      shares: 0,
      downloads: 0,
      bookmarks: 0,
      watchTime: 0,
      ratingsCount: 0,
    };

    const hasMongoActivity =
      mongoTotals.views +
      mongoTotals.starts +
      mongoTotals.completes +
      mongoTotals.chapterCompletes +
      mongoTotals.likes +
      mongoTotals.shares +
      mongoTotals.downloads +
      mongoTotals.bookmarks +
      mongoTotals.ratingsCount >
      0;

    let trackingTotals: any = null;
    if (!ga4Totals && (!totalsAgg.length || !hasMongoActivity)) {
      const tracking = this.dbConnection.collection('trackingactions');
      const contentDoc = {
        $ifNull: [
          { $arrayElemAt: ['$course', 0] },
          {
            $ifNull: [
              { $arrayElemAt: ['$challenge', 0] },
              {
                $ifNull: [
                  { $arrayElemAt: ['$session', 0] },
                  {
                    $ifNull: [
                      { $arrayElemAt: ['$event', 0] },
                      {
                        $ifNull: [
                          { $arrayElemAt: ['$product', 0] },
                          { $arrayElemAt: ['$post', 0] },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const trackingAgg = await tracking
        .aggregate([
          { $match: { timestamp: { $gte: from, $lte: to } } },
          { $lookup: { from: 'cours', localField: 'contentId', foreignField: 'id', as: 'course' } },
          { $lookup: { from: 'challenges', localField: 'contentId', foreignField: 'id', as: 'challenge' } },
          { $lookup: { from: 'sessions', localField: 'contentId', foreignField: 'id', as: 'session' } },
          { $lookup: { from: 'events', localField: 'contentId', foreignField: 'id', as: 'event' } },
          { $lookup: { from: 'products', localField: 'contentId', foreignField: 'id', as: 'product' } },
          { $lookup: { from: 'posts', localField: 'contentId', foreignField: 'id', as: 'post' } },
          { $addFields: { contentDoc } },
          { $addFields: { creatorIdResolved: { $ifNull: ['$contentDoc.creatorId', '$contentDoc.authorId'] } } },
          { $match: { creatorIdResolved: this.getCreatorObjectId(creatorId) } },
          ...(communityScope.hasFilter ? [{ $match: this.buildLookupCommunityMatch('contentDoc.communityId', communityScope.lookupCommunityValues) }] : []),
          {
            $group: {
              _id: null,
              views: { $sum: { $cond: [{ $eq: ['$actionType', 'view'] }, 1, 0] } },
              starts: { $sum: { $cond: [{ $eq: ['$actionType', 'start'] }, 1, 0] } },
              completes: { $sum: { $cond: [isCourseCompleteActionExpr, 1, 0] } },
              chapterCompletes: { $sum: { $cond: [isChapterCompleteActionExpr, 1, 0] } },
              likes: { $sum: { $cond: [{ $eq: ['$actionType', 'like'] }, 1, 0] } },
              shares: { $sum: { $cond: [{ $eq: ['$actionType', 'share'] }, 1, 0] } },
              downloads: { $sum: { $cond: [{ $eq: ['$actionType', 'download'] }, 1, 0] } },
              bookmarks: { $sum: { $cond: [{ $eq: ['$actionType', 'bookmark'] }, 1, 0] } },
              ratingsCount: { $sum: { $cond: [{ $eq: ['$actionType', 'rate'] }, 1, 0] } },
            },
          },
          { $project: { _id: 0 } },
        ])
        .toArray();

      trackingTotals = trackingAgg?.[0] || null;
    }

    const resolvedChapterCompletes =
      Number(trackingTotals?.chapterCompletes ?? mongoTotals.chapterCompletes ?? 0) || 0;

    const totals = ga4Totals
      ? { ...ga4Totals, watchTime: mongoTotals.watchTime, chapterCompletes: resolvedChapterCompletes }
      : trackingTotals
        ? { ...trackingTotals, watchTime: mongoTotals.watchTime, chapterCompletes: resolvedChapterCompletes }
        : mongoTotals;


    // Revenue must include orders without `communityId`, so resolve community from content when needed.
    const revenue = await this.aggregateCreatorRevenue(creatorId, from, to, communityScope);

    // Calculate engagement rate: (interactions / views) * 100
    // Interactions include: starts, completes, likes, shares, downloads, bookmarks
    const interactions = totals.starts + totals.completes + totals.likes + totals.shares + totals.downloads + totals.bookmarks;
    const engagementRate = totals.views > 0 ? (interactions / totals.views) * 100 : 0;

    let trend = await this.dailyModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$date',
          views: { $sum: '$views' },
          starts: { $sum: '$starts' },
          completes: { $sum: '$completes' },
          watchTime: { $sum: '$watchTime' },
        },
      },
      { $project: { _id: 0, date: '$_id', views: 1, starts: 1, completes: 1, watchTime: 1 } },
      { $sort: { date: 1 } },
    ]);

    try {
      const ga4Trend = await this.ga4ReportingService.getCreatorDailyTrend(
        creatorId,
        from.toISOString().slice(0, 10),
        to.toISOString().slice(0, 10),
        communityScope.ga4CommunityId,
      );
      if (ga4Trend.length > 0) {
        trend = ga4Trend;
      }
    } catch {
      // Keep Mongo trend as fallback
    }

    const topContents = await this.dailyModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { contentType: '$contentType', contentId: '$contentId' },
          views: { $sum: '$views' },
          completes: { $sum: '$completes' },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 3 },
      { $project: { _id: 0, contentType: '$_id.contentType', contentId: '$_id.contentId', views: 1, completes: 1 } },
    ]);

    const sampleEvents =
      Number(totals.views || 0) +
      Number(totals.starts || 0) +
      Number(totals.completes || 0) +
      Number(totals.chapterCompletes || 0) +
      Number(totals.likes || 0) +
      Number(totals.shares || 0) +
      Number(totals.downloads || 0) +
      Number(totals.bookmarks || 0) +
      Number(totals.ratingsCount || 0);

    const full = {
      totals,
      revenue: {
        total: revenue.total,
        count: revenue.count
      },
      engagementRate: Math.round(engagementRate * 100) / 100, // Round to 2 decimal places
      trend,
      topContents,
      meta: this.buildAnalyticsQualityMeta({
        from,
        to,
        source: ga4Totals ? 'ga4' : trackingTotals ? 'tracking_fallback' : 'mongo_rollup',
        events: sampleEvents,
        trend,
      }),
    };
    this.setCache(key, full);
    return this.shapeOverview(full, plan);
  }

  async getCourses(creatorId: string, from: Date, to: Date, communityId?: string, communitySlug?: string) {
    const communityScope = await this.resolveCommunityScope(creatorId, communityId, communitySlug);
    const key = this.cacheKey(creatorId, from.toISOString(), to.toISOString(), `courses:${communityScope.cacheKeyPart}`);
    const cached = await this.getCache<any>(key);
    if (cached) return cached;

    const match = {
      creatorId: this.getCreatorObjectId(creatorId),
      date: { $gte: from, $lte: to },
      contentType: 'course',
    } as any;

    if (communityScope.hasFilter) {
      this.setDailyCommunityFilter(match, communityScope.communityIdStrings);
    }

    const chapterIdExpr = { $ifNull: ['$metadata.chapterId', ''] };
    const isChapterStartActionExpr = {
      $or: [
        { $eq: ['$actionType', TrackingActionType.CHAPTER_START] },
        {
          $and: [
            { $eq: ['$actionType', TrackingActionType.START] },
            { $ne: [chapterIdExpr, ''] },
          ],
        },
      ],
    };
    const isChapterCompleteActionExpr = {
      $or: [
        { $eq: ['$actionType', TrackingActionType.CHAPTER_COMPLETE] },
        {
          $and: [
            { $eq: ['$actionType', TrackingActionType.COMPLETE] },
            { $ne: [chapterIdExpr, ''] },
          ],
        },
      ],
    };

    let byCourse = await this.dailyModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$contentId',
          views: { $sum: '$views' },
          starts: { $sum: '$starts' },
          completes: { $sum: '$completes' },
          chapterCompletes: { $sum: '$chapterCompletes' },
          watchTime: { $sum: '$watchTime' },
          ratingsCount: { $sum: '$ratingsCount' },
        },
      },
      {
        $project: {
          _id: 0,
          contentId: '$_id',
          views: 1,
          starts: 1,
          completes: 1,
          chapterCompletes: 1,
          watchTime: 1,
          ratingsCount: 1,
          completionRate: {
            $cond: [{ $gt: ['$starts', 0] }, { $divide: ['$completes', '$starts'] }, 0],
          },
        },
      },
      { $sort: { views: -1 } },
    ]);

    // If there is no rollup data yet for this creator, attempt a one-time backfill
    if (!byCourse.length) {
      await this.backfillForCreator(creatorId, 90);

      byCourse = await this.dailyModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$contentId',
            views: { $sum: '$views' },
            starts: { $sum: '$starts' },
            completes: { $sum: '$completes' },
            chapterCompletes: { $sum: '$chapterCompletes' },
            watchTime: { $sum: '$watchTime' },
            ratingsCount: { $sum: '$ratingsCount' },
          },
        },
        {
          $project: {
            _id: 0,
            contentId: '$_id',
            views: 1,
            starts: 1,
            completes: 1,
            chapterCompletes: 1,
            watchTime: 1,
            ratingsCount: 1,
            completionRate: {
              $cond: [{ $gt: ['$starts', 0] }, { $divide: ['$completes', '$starts'] }, 0],
            },
          },
        },
        { $sort: { views: -1 } },
      ]);
    }

    // Try GA4 and merge if available
    try {
      const ga4Stats = await this.ga4ReportingService.getCreatorContentStats(
        creatorId,
        'course',
        from.toISOString().slice(0, 10),
        to.toISOString().slice(0, 10),
        communityScope.ga4CommunityId
      );

      if (ga4Stats.length > 0) {
        const mongoMap = new Map(byCourse.map(c => [c.contentId, c]));

        // Use GA4 stats but preserve watchTime from Mongo
        byCourse = ga4Stats.map(s => {
          const m = mongoMap.get(s.contentId) || { watchTime: 0, chapterCompletes: 0 };
          return {
            contentId: s.contentId,
            views: s.views,
            starts: s.starts,
            completes: s.completes,
            chapterCompletes: Number((m as any)?.chapterCompletes || 0),
            watchTime: m.watchTime,
            ratingsCount: s.ratingsCount,
            completionRate: s.starts > 0 ? s.completes / s.starts : 0
          };
        }).sort((a, b) => b.views - a.views);
      }
    } catch (e) {
      // Ignore GA4 errors
    }

    const courseIds = byCourse.map((c: any) => c.contentId).filter(Boolean);
    if (courseIds.length > 0) {
      const courseDocs =
        (await this.dbConnection.db
          ?.collection('cours')
          .find({ id: { $in: courseIds } })
          .project({ id: 1, titre: 1, title: 1, name: 1 })
          .toArray()) || [];
      const titleById = new Map(
        courseDocs.map((c: any) => [
          c.id,
          (c.titre || c.title || c.name || c.id || '').toString(),
        ]),
      );
      byCourse = byCourse.map((c: any) => ({
        ...c,
        title: titleById.get(c.contentId) || c.contentId,
      }));
    }

    const tracking = this.dbConnection.collection('trackingactions');

    const chapterCompletesByCourse = await tracking
      .aggregate([
        { $match: { timestamp: { $gte: from, $lte: to }, contentType: 'course' } },
        { $lookup: { from: 'cours', localField: 'contentId', foreignField: 'id', as: 'course' } },
        { $unwind: '$course' },
        { $match: { 'course.creatorId': this.getCreatorObjectId(creatorId) } },
        ...(communityScope.hasFilter ? [{ $match: this.buildLookupCommunityMatch('course.communityId', communityScope.lookupCommunityValues) }] : []),
        {
          $group: {
            _id: '$contentId',
            chapterCompletes: { $sum: { $cond: [isChapterCompleteActionExpr, 1, 0] } },
          },
        },
        { $project: { _id: 0, contentId: '$_id', chapterCompletes: 1 } },
      ])
      .toArray();

    if (chapterCompletesByCourse.length > 0) {
      const chapterCompletesMap = new Map(
        chapterCompletesByCourse.map((entry: any) => [String(entry.contentId), Number(entry.chapterCompletes || 0)]),
      );
      const existingCourseIds = new Set(byCourse.map((entry: any) => String(entry.contentId)));
      byCourse = byCourse.map((entry: any) => ({
        ...entry,
        chapterCompletes: chapterCompletesMap.get(String(entry.contentId)) ?? Number(entry.chapterCompletes || 0),
      }));

      for (const [contentId, chapterCompletes] of chapterCompletesMap.entries()) {
        if (existingCourseIds.has(contentId)) continue;
        byCourse.push({
          contentId,
          title: contentId,
          views: 0,
          starts: 0,
          completes: 0,
          chapterCompletes,
          watchTime: 0,
          ratingsCount: 0,
          completionRate: 0,
        });
      }

      byCourse.sort((a: any, b: any) => Number(b.views || 0) - Number(a.views || 0));
    }

    // Chapter funnel (drop-offs) from trackingactions metadata if available (chapterId)
    const funnelPipeline: any[] = [
      { $match: { timestamp: { $gte: from, $lte: to }, contentType: 'course' } },
      { $lookup: { from: 'cours', localField: 'contentId', foreignField: 'id', as: 'course' } },
      { $unwind: '$course' },
      { $match: { 'course.creatorId': this.getCreatorObjectId(creatorId) } },
    ];

    if (communityScope.hasFilter) {
      funnelPipeline.push({ $match: this.buildLookupCommunityMatch('course.communityId', communityScope.lookupCommunityValues) });
    }

    funnelPipeline.push(
      {
        $project: {
          contentId: 1,
          actionType: 1,
          chapterId: '$metadata.chapterId',
          chapterIdNormalized: chapterIdExpr,
        },
      },
      { $match: { chapterIdNormalized: { $ne: '' } } },
      {
        $group: {
          _id: { contentId: '$contentId', chapterId: '$chapterIdNormalized' },
          views: { $sum: { $cond: [{ $eq: ['$actionType', 'view'] }, 1, 0] } },
          starts: { $sum: { $cond: [isChapterStartActionExpr, 1, 0] } },
          completes: { $sum: { $cond: [isChapterCompleteActionExpr, 1, 0] } },
        },
      },
      { $project: { _id: 0, contentId: '$_id.contentId', chapterId: '$_id.chapterId', views: 1, starts: 1, completes: 1, completionRate: { $cond: [{ $gt: ['$starts', 0] }, { $divide: ['$completes', '$starts'] }, 0] } } },
      { $sort: { contentId: 1 } },
    );

    const chapterFunnel = await tracking.aggregate(funnelPipeline).toArray();

    this.setCache(key, { byCourse, chapterFunnel });
    return { byCourse, chapterFunnel };
  }

  async getChallenges(creatorId: string, from: Date, to: Date, communityId?: string, communitySlug?: string) {
    const communityScope = await this.resolveCommunityScope(creatorId, communityId, communitySlug);
    const key = this.cacheKey(creatorId, from.toISOString(), to.toISOString(), `challenges:${communityScope.cacheKeyPart}`);
    const cached = await this.getCache<any>(key);
    if (cached) return cached;

    const match = {
      creatorId: this.getCreatorObjectId(creatorId),
      date: { $gte: from, $lte: to },
      contentType: 'challenge',
    } as any;

    if (communityScope.hasFilter) {
      this.setDailyCommunityFilter(match, communityScope.communityIdStrings);
    }

    // Aggregate from AnalyticsDaily for basic metrics
    const byChallenge = await this.dailyModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$contentId',
          views: { $sum: '$views' },
          starts: { $sum: '$starts' },
          completes: { $sum: '$completes' },
          likes: { $sum: '$likes' },
          shares: { $sum: '$shares' },
          bookmarks: { $sum: '$bookmarks' },
        },
      },
      {
        $project: {
          _id: 0,
          contentId: '$_id',
          views: 1,
          starts: 1,
          completes: 1,
          likes: 1,
          shares: 1,
          bookmarks: 1,
          participants: '$starts',
          submissions: '$completes',
          winners: { $floor: { $multiply: [{ $cond: [{ $gt: ['$starts', 0] }, { $divide: ['$completes', '$starts'] }, 0] }, 0.3] } },
          completionRate: { $cond: [{ $gt: ['$starts', 0] }, { $multiply: [{ $divide: ['$completes', '$starts'] }, 100] }, 0] }
        }
      },
      { $sort: { completes: -1 } },
    ]);

    // Prefer GA4 content stats when available
    try {
      const ga4Stats = await this.ga4ReportingService.getCreatorContentStats(
        creatorId,
        'challenge',
        from.toISOString().slice(0, 10),
        to.toISOString().slice(0, 10),
        communityScope.ga4CommunityId,
      );

      if (ga4Stats.length > 0) {
        byChallenge.length = 0;
        for (const s of ga4Stats) {
          const completionRate = s.starts > 0 ? (s.completes / s.starts) * 100 : 0;
          byChallenge.push({
            contentId: s.contentId,
            views: s.views,
            starts: s.starts,
            completes: s.completes,
            likes: s.likes,
            shares: s.shares,
            bookmarks: s.bookmarks,
            participants: s.starts,
            submissions: s.completes,
            winners: completionRate >= 90 ? Math.max(1, Math.floor(s.completes * 0.3)) : 0,
            completionRate,
          });
        }
        byChallenge.sort((a: any, b: any) => Number(b.completes || 0) - Number(a.completes || 0));
      }
    } catch {
      // Keep Mongo aggregate
    }

    // Get challenge titles
    const challengeIds = byChallenge.map((c: any) => c.contentId).filter(Boolean);
    if (challengeIds.length > 0) {
      const challengeDocs =
        (await this.dbConnection.db
          ?.collection('challenges')
          .find({ id: { $in: challengeIds } })
          .project({ id: 1, title: 1, tasks: 1 })
          .toArray()) || [];
      const titleById = new Map(
        challengeDocs.map((c: any) => [
          c.id,
          (c.title || c.id || '').toString(),
        ]),
      );
      const tasksById = new Map(
        challengeDocs.map((c: any) => [
          c.id,
          c.tasks?.length || 0,
        ]),
      );

      // Update with titles and recalculate winners based on task completion
      for (const c of byChallenge) {
        c.title = titleById.get(c.contentId) || c.contentId;
        const totalTasks = tasksById.get(c.contentId) || 1;
        // Winners are users who completed all tasks (approximated by having completionRate >= 90%)
        c.winners = c.completionRate >= 90 ? Math.max(1, Math.floor(c.completes * 0.3)) : 0;
      }
    }

    // Task-level funnel using trackingactions metadata.taskId
    const tracking = this.dbConnection.collection('trackingactions');
    const funnelPipeline: any[] = [
      { $match: { timestamp: { $gte: from, $lte: to }, contentType: 'challenge' } },
      { $lookup: { from: 'challenges', localField: 'contentId', foreignField: 'id', as: 'challenge' } },
      { $unwind: '$challenge' },
      { $match: { 'challenge.creatorId': this.getCreatorObjectId(creatorId) } },
    ];

    if (communityScope.hasFilter) {
      funnelPipeline.push({ $match: this.buildLookupCommunityMatch('challenge.communityId', communityScope.lookupCommunityValues) });
    }

    funnelPipeline.push(
      { $project: { contentId: 1, actionType: 1, taskId: '$metadata.taskId', userId: 1, metadata: 1 } },
      { $match: { taskId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: { contentId: '$contentId', taskId: '$taskId' },
          uniqueUsers: { $addToSet: '$userId' },
          starts: { $sum: { $cond: [{ $eq: ['$actionType', 'start'] }, 1, 0] } },
          completes: { $sum: { $cond: [{ $eq: ['$actionType', 'complete'] }, 1, 0] } },
        },
      },
      { $project: { _id: 0, contentId: '$_id.contentId', taskId: '$_id.taskId', starts: 1, completes: 1, uniqueUsers: { $size: '$uniqueUsers' }, completionRate: { $cond: [{ $gt: ['$starts', 0] }, { $divide: ['$completes', '$starts'] }, 0] } } },
      { $sort: { contentId: 1 } },
    );

    const stepFunnel = await tracking.aggregate(funnelPipeline).toArray();

    // Get distinct participants per challenge from tracking
    const participantsPipeline: any[] = [
      { $match: { timestamp: { $gte: from, $lte: to }, contentType: 'challenge', actionType: 'start' } },
      { $lookup: { from: 'challenges', localField: 'contentId', foreignField: 'id', as: 'challenge' } },
      { $unwind: '$challenge' },
      { $match: { 'challenge.creatorId': this.getCreatorObjectId(creatorId) } },
    ];

    if (communityScope.hasFilter) {
      participantsPipeline.push({ $match: this.buildLookupCommunityMatch('challenge.communityId', communityScope.lookupCommunityValues) });
    }

    participantsPipeline.push(
      { $group: { _id: { contentId: '$contentId', userId: '$userId' } } },
      { $group: { _id: '$_id.contentId', participants: { $sum: 1 } } },
      { $project: { _id: 0, contentId: '$_id', participants: 1 } }
    );

    const participantsData = await tracking.aggregate(participantsPipeline).toArray();
    const participantsMap = new Map(participantsData.map(p => [p.contentId, p.participants]));

    // Merge participants into byChallenge
    for (const c of byChallenge) {
      c.participants = participantsMap.get(c.contentId) || c.starts || 0;
    }

    // FALLBACK: If no rollup data, build challenge list from trackingactions directly
    if (byChallenge.length === 0) {
      const trackingAggPipeline: any[] = [
        { $match: { timestamp: { $gte: from, $lte: to }, contentType: 'challenge' } },
        { $lookup: { from: 'challenges', localField: 'contentId', foreignField: 'id', as: 'challenge' } },
        { $unwind: '$challenge' },
      { $match: { 'challenge.creatorId': this.getCreatorObjectId(creatorId) } },
      ];

      if (communityScope.hasFilter) {
        trackingAggPipeline.push({ $match: this.buildLookupCommunityMatch('challenge.communityId', communityScope.lookupCommunityValues) });
      }

      trackingAggPipeline.push(
        {
          $group: {
            _id: '$contentId',
            views: { $sum: { $cond: [{ $eq: ['$actionType', 'view'] }, 1, 0] } },
            starts: { $sum: { $cond: [{ $eq: ['$actionType', 'start'] }, 1, 0] } },
            completes: { $sum: { $cond: [{ $eq: ['$actionType', 'complete'] }, 1, 0] } },
            likes: { $sum: { $cond: [{ $eq: ['$actionType', 'like'] }, 1, 0] } },
            shares: { $sum: { $cond: [{ $eq: ['$actionType', 'share'] }, 1, 0] } },
            bookmarks: { $sum: { $cond: [{ $eq: ['$actionType', 'bookmark'] }, 1, 0] } },
            challengeTitle: { $first: '$challenge.title' },
            challengeTasks: { $first: '$challenge.tasks' },
          },
        },
        {
          $project: {
            _id: 0,
            contentId: '$_id',
            views: 1,
            starts: 1,
            completes: 1,
            likes: 1,
            shares: 1,
            bookmarks: 1,
            participants: '$starts',
            submissions: '$completes',
            winners: { $floor: { $multiply: [{ $cond: [{ $gt: ['$starts', 0] }, { $divide: ['$completes', '$starts'] }, 0] }, 0.3] } },
            completionRate: { $cond: [{ $gt: ['$starts', 0] }, { $multiply: [{ $divide: ['$completes', '$starts'] }, 100] }, 0] },
            title: '$challengeTitle',
            totalTasks: { $size: { $ifNull: ['$challengeTasks', []] } },
          },
        },
        { $sort: { completes: -1 } },
      );

      const trackingResults = await tracking.aggregate(trackingAggPipeline).toArray();

      // Recalculate winners based on completion rate
      for (const c of trackingResults) {
        c.winners = c.completionRate >= 90 ? Math.max(1, Math.floor(c.completes * 0.3)) : 0;
        // Override participants with distinct count from participantsMap if available
        c.participants = participantsMap.get(c.contentId) || c.starts || 0;
      }

      if (trackingResults.length > 0) {
        this.setCache(key, { byChallenge: trackingResults, stepFunnel });
        return { byChallenge: trackingResults, stepFunnel };
      }
    }

    // FINAL FALLBACK: Query actual challenge documents + submissions collection directly
    // This ensures data shows up even when no tracking events or rollup data exist
    try {
      const challengeQuery: any = { creatorId: this.getCreatorObjectId(creatorId) }; // removed isActive: true to show historical data
      if (communityScope.hasFilter) {
        challengeQuery.communityId = { $in: communityScope.lookupCommunityValues };
      }

      const challengeDocs = await this.dbConnection.db
        ?.collection('challenges')
        .find(challengeQuery)
        .project({ id: 1, _id: 1, title: 1, tasks: 1, participants: 1, communityId: 1 })
        .toArray() || [];

      if (challengeDocs.length > 0) {
        const challengeObjectIds = challengeDocs.map((c: any) => c._id);

        // Count submissions within the date range
        const submissionCounts = await this.dbConnection.db
          ?.collection('challengesubmissions')
          .aggregate([
            {
              $match: {
                challengeId: { $in: challengeObjectIds },
                createdAt: { $gte: from, $lte: to } // Filter by date range
              }
            },
            { $group: { _id: '$challengeId', count: { $sum: 1 } } },
          ])
          .toArray() || [];

        const submissionMap = new Map(
          submissionCounts.map((s: any) => [s._id.toString(), s.count]),
        );

        if (byChallenge.length === 0) {
          // No rollup or tracking data at all — build from challenge docs
          const liveData = challengeDocs.map((c: any) => {
            // Filter participants by joinedAt date range
            const participantsList = Array.isArray(c.participants) ? c.participants : [];
            const periodParticipants = participantsList.filter((p: any) => {
              const joinedAt = new Date(p.joinedAt || p.createdAt || 0);
              return joinedAt >= from && joinedAt <= to;
            }).length;

            const submissionCount = submissionMap.get(c._id.toString()) || 0;
            const totalTasks = Array.isArray(c.tasks) ? c.tasks.length : 0;
            const completionRate = periodParticipants > 0
              ? (submissionCount / (periodParticipants * Math.max(totalTasks, 1))) * 100
              : 0;

            // Only include if there's activity or we really want to show valid challenges with 0 activity?
            // Usually analytics shows items with 0 activity if they exist? 
            // Better to show them.

            return {
              contentId: c.id || c._id.toString(),
              title: c.title || c.id || 'Untitled Challenge',
              views: periodParticipants, // Proxy views with starts for fallback
              starts: periodParticipants,
              completes: submissionCount > 0 ? Math.ceil(submissionCount / Math.max(totalTasks, 1)) : 0, // Approx
              likes: 0,
              shares: 0,
              bookmarks: 0,
              participants: periodParticipants, // Valid for the period
              submissions: submissionCount,
              winners: 0,
              completionRate: Math.round(completionRate),
              totalTasks,
            };
          });

          // Sort by submissions or starts
          liveData.sort((a: any, b: any) => b.submissions - a.submissions);

          this.setCache(key, { byChallenge: liveData, stepFunnel });
          return { byChallenge: liveData, stepFunnel };
        } else {
          // Enrich existing byChallenge entries
          // Note: Rollup data is already date-filtered. 
          // If we enrich, we should use the period-filtered fallback data too.
          const liveMap = new Map(
            challengeDocs.map((c: any) => {
              const participantsList = Array.isArray(c.participants) ? c.participants : [];
              const periodParticipants = participantsList.filter((p: any) => {
                const joinedAt = new Date(p.joinedAt || p.createdAt || 0);
                return joinedAt >= from && joinedAt <= to;
              }).length;

              return [
                c.id || c._id.toString(),
                {
                  participants: periodParticipants,
                  submissions: submissionMap.get(c._id.toString()) || 0,
                },
              ];
            }),
          );

          for (const c of byChallenge) {
            const live = liveMap.get(c.contentId);
            if (live) {
              // Only override if live data is greater (missing tracking)
              // But wait, if rollup says 0 and live says 5, usage live.
              c.participants = Math.max(c.participants || 0, live.participants);
              c.submissions = Math.max(c.submissions || 0, live.submissions);
            }
          }
        }
      }
    } catch (liveErr) {
      console.warn('[AnalyticsService] Live challenge data fallback error:', liveErr);
    }

    this.setCache(key, { byChallenge, stepFunnel });
    return { byChallenge, stepFunnel };
  }

  async getSessions(creatorId: string, from: Date, to: Date, communityId?: string, communitySlug?: string) {
    const communityScope = await this.resolveCommunityScope(creatorId, communityId, communitySlug);
    const key = this.cacheKey(creatorId, from.toISOString(), to.toISOString(), `sessions:${communityScope.cacheKeyPart}`);
    const cached = await this.getCache<any>(key);
    if (cached) return cached;
    const match = { creatorId: this.getCreatorObjectId(creatorId), date: { $gte: from, $lte: to }, contentType: 'session' } as any;

    if (communityScope.hasFilter) {
      this.setDailyCommunityFilter(match, communityScope.communityIdStrings);
    }

    const bySession = await this.dailyModel.aggregate([
      { $match: match },
      { $group: { _id: '$contentId', views: { $sum: '$views' }, starts: { $sum: '$starts' }, completes: { $sum: '$completes' } } },
      { $project: { _id: 0, contentId: '$_id', views: 1, starts: 1, completes: 1, completionRate: { $cond: [{ $gt: ['$starts', 0] }, { $divide: ['$completes', '$starts'] }, 0] } } },
      { $sort: { views: -1 } },
    ]);
    try {
      const ga4Stats = await this.ga4ReportingService.getCreatorContentStats(
        creatorId,
        'session',
        from.toISOString().slice(0, 10),
        to.toISOString().slice(0, 10),
        communityScope.ga4CommunityId,
      );
      if (ga4Stats.length > 0) {
        bySession.length = 0;
        for (const s of ga4Stats) {
          bySession.push({
            contentId: s.contentId,
            views: s.views,
            starts: s.starts,
            completes: s.completes,
            completionRate: s.starts > 0 ? s.completes / s.starts : 0,
          });
        }
        bySession.sort((a: any, b: any) => Number(b.views || 0) - Number(a.views || 0));
      }
    } catch {
      // Keep Mongo aggregate
    }
    this.setCache(key, { bySession });
    return { bySession };
  }

  async getEvents(creatorId: string, from: Date, to: Date, communityId?: string, communitySlug?: string) {
    const communityScope = await this.resolveCommunityScope(creatorId, communityId, communitySlug);
    const key = this.cacheKey(creatorId, from.toISOString(), to.toISOString(), `events:${communityScope.cacheKeyPart}`);
    const cached = await this.getCache<any>(key);
    if (cached) return cached;
    const match = { creatorId: this.getCreatorObjectId(creatorId), date: { $gte: from, $lte: to }, contentType: 'event' } as any;

    if (communityScope.hasFilter) {
      this.setDailyCommunityFilter(match, communityScope.communityIdStrings);
    }

    const byEvent = await this.dailyModel.aggregate([
      { $match: match },
      { $group: { _id: '$contentId', views: { $sum: '$views' }, starts: { $sum: '$starts' }, completes: { $sum: '$completes' } } },
      { $project: { _id: 0, contentId: '$_id', views: 1, starts: 1, completes: 1 } },
      { $sort: { views: -1 } },
    ]);

    // Revenue by event for the same period/scope.
    const revenueMatch: any = {
      creatorId: this.getCreatorObjectId(creatorId),
      status: 'paid',
      contentType: 'event',
      createdAt: { $gte: from, $lte: to },
    };
    if (communityScope.hasFilter) {
      revenueMatch.communityId = { $in: communityScope.lookupCommunityValues };
    }

    const revenueByEvent = await this.dbConnection.db?.collection('orders').aggregate([
      { $match: revenueMatch },
      {
        $group: {
          _id: '$contentId',
          revenue: { $sum: '$creatorNetDT' },
          salesCount: { $sum: 1 },
        }
      },
      {
        $project: {
          _id: 0,
          contentId: '$_id',
          revenue: 1,
          salesCount: 1,
        }
      }
    ]).toArray() || [];

    const revenueMap = new Map<string, { revenue: number; salesCount: number }>(
      revenueByEvent.map((item: any) => [
        String(item.contentId),
        {
          revenue: Number(item.revenue || 0),
          salesCount: Number(item.salesCount || 0),
        },
      ]),
    );
    const fullRevenueMap = new Map(revenueMap);

    for (const item of byEvent) {
      const revenueItem = revenueMap.get(String(item.contentId));
      (item as any).revenue = Number(revenueItem?.revenue || 0);
      (item as any).salesCount = Number(revenueItem?.salesCount || 0);
      revenueMap.delete(String(item.contentId));
    }

    // Include events that have revenue but no tracking rows.
    for (const [contentId, rev] of revenueMap.entries()) {
      byEvent.push({
        contentId,
        views: 0,
        starts: 0,
        completes: 0,
        revenue: Number(rev.revenue || 0),
        salesCount: Number(rev.salesCount || 0),
      } as any);
    }
    try {
      const ga4Stats = await this.ga4ReportingService.getCreatorContentStats(
        creatorId,
        'event',
        from.toISOString().slice(0, 10),
        to.toISOString().slice(0, 10),
        communityScope.ga4CommunityId,
      );
      if (ga4Stats.length > 0) {
        byEvent.length = 0;
        const remainingRevenueMap = new Map(fullRevenueMap);
        for (const s of ga4Stats) {
          const revenueItem = remainingRevenueMap.get(String(s.contentId));
          byEvent.push({
            contentId: s.contentId,
            views: s.views,
            starts: s.starts,
            completes: s.completes,
            revenue: Number(revenueItem?.revenue || 0),
            salesCount: Number(revenueItem?.salesCount || 0),
          });
          remainingRevenueMap.delete(String(s.contentId));
        }
        // Include revenue-only events even when GA4 data exists.
        for (const [contentId, rev] of remainingRevenueMap.entries()) {
          if (!byEvent.some((e: any) => String(e.contentId) === String(contentId))) {
            byEvent.push({
              contentId,
              views: 0,
              starts: 0,
              completes: 0,
              revenue: Number(rev.revenue || 0),
              salesCount: Number(rev.salesCount || 0),
            } as any);
          }
        }
        byEvent.sort((a: any, b: any) => Number(b.views || 0) - Number(a.views || 0));
      }
    } catch {
      // Keep Mongo aggregate
    }
    this.setCache(key, { byEvent });
    return { byEvent };
  }

  async getProducts(creatorId: string, from: Date, to: Date, communityId?: string, communitySlug?: string) {
    const communityScope = await this.resolveCommunityScope(creatorId, communityId, communitySlug);
    const key = this.cacheKey(creatorId, from.toISOString(), to.toISOString(), `products:${communityScope.cacheKeyPart}`);
    const cached = await this.getCache<any>(key);
    if (cached) return cached;
    const match = { creatorId: this.getCreatorObjectId(creatorId), date: { $gte: from, $lte: to }, contentType: 'product' } as any;

    if (communityScope.hasFilter) {
      this.setDailyCommunityFilter(match, communityScope.communityIdStrings);
    }

    const byProduct = await this.dailyModel.aggregate([
      { $match: match },
      { $group: { _id: '$contentId', views: { $sum: '$views' }, likes: { $sum: '$likes' }, shares: { $sum: '$shares' }, downloads: { $sum: '$downloads' } } },
      { $project: { _id: 0, contentId: '$_id', views: 1, likes: 1, shares: 1, downloads: 1 } },
      { $sort: { views: -1 } },
    ]);
    try {
      const ga4Stats = await this.ga4ReportingService.getCreatorContentStats(
        creatorId,
        'product',
        from.toISOString().slice(0, 10),
        to.toISOString().slice(0, 10),
        communityScope.ga4CommunityId,
      );
      if (ga4Stats.length > 0) {
        byProduct.length = 0;
        for (const s of ga4Stats) {
          byProduct.push({
            contentId: s.contentId,
            views: s.views,
            likes: s.likes,
            shares: s.shares,
            downloads: s.downloads,
          });
        }
        byProduct.sort((a: any, b: any) => Number(b.views || 0) - Number(a.views || 0));
      }
    } catch {
      // Keep Mongo aggregate
    }
    this.setCache(key, { byProduct });
    return { byProduct };
  }

  async getPosts(creatorId: string, from: Date, to: Date, communityId?: string, communitySlug?: string) {
    const communityScope = await this.resolveCommunityScope(creatorId, communityId, communitySlug);
    const key = this.cacheKey(creatorId, from.toISOString(), to.toISOString(), `posts:${communityScope.cacheKeyPart}`);
    const cached = await this.getCache<any>(key);
    if (cached) return cached;
    const creatorObjectId = this.getCreatorObjectId(creatorId);
    const match = { creatorId: creatorObjectId, date: { $gte: from, $lte: to }, contentType: 'post' } as any;

    if (communityScope.hasFilter) {
      this.setDailyCommunityFilter(match, communityScope.communityIdStrings);
    }

    const byPost = await this.dailyModel.aggregate([
      { $match: match },
      { $group: { _id: '$contentId', views: { $sum: '$views' }, likes: { $sum: '$likes' }, shares: { $sum: '$shares' }, bookmarks: { $sum: '$bookmarks' }, ratingsCount: { $sum: '$ratingsCount' } } },
      { $project: { _id: 0, contentId: '$_id', views: 1, likes: 1, shares: 1, bookmarks: 1, ratingsCount: 1 } },
      { $sort: { views: -1 } },
    ]);

    const hasRollupActivity = byPost.some((row: any) =>
      Number(row?.views || 0) > 0 ||
      Number(row?.likes || 0) > 0 ||
      Number(row?.shares || 0) > 0 ||
      Number(row?.bookmarks || 0) > 0 ||
      Number(row?.ratingsCount || 0) > 0,
    );

    if (!hasRollupActivity) {
      const trackingFallback = await this.dbConnection.collection('trackingactions').aggregate([
        { $match: { timestamp: { $gte: from, $lte: to }, contentType: 'post' } },
        { $lookup: { from: 'posts', localField: 'contentId', foreignField: 'id', as: 'post' } },
        { $unwind: { path: '$post', preserveNullAndEmptyArrays: false } },
        { $match: { 'post.authorId': creatorObjectId } },
        ...(communityScope.hasFilter
          ? [{ $match: this.buildLookupCommunityMatch('post.communityId', communityScope.lookupCommunityValues) }]
          : []),
        {
          $group: {
            _id: '$contentId',
            views: { $sum: { $cond: [{ $eq: ['$actionType', TrackingActionType.VIEW] }, 1, 0] } },
            likes: { $sum: { $cond: [{ $eq: ['$actionType', TrackingActionType.LIKE] }, 1, 0] } },
            shares: { $sum: { $cond: [{ $eq: ['$actionType', TrackingActionType.SHARE] }, 1, 0] } },
            bookmarks: { $sum: { $cond: [{ $eq: ['$actionType', TrackingActionType.BOOKMARK] }, 1, 0] } },
            ratingsCount: { $sum: { $cond: [{ $eq: ['$actionType', TrackingActionType.RATE] }, 1, 0] } },
          },
        },
        { $project: { _id: 0, contentId: '$_id', views: 1, likes: 1, shares: 1, bookmarks: 1, ratingsCount: 1 } },
        { $sort: { views: -1 } },
      ]).toArray();

      if (trackingFallback.length > 0) {
        byPost.length = 0;
        byPost.push(...trackingFallback);
        this.logger.log(
          `Post analytics fallback used for creator=${creatorId}; rows=${trackingFallback.length}; range=${from.toISOString()}..${to.toISOString()}`,
        );
      }
    }

    try {
      const ga4Stats = await this.ga4ReportingService.getCreatorContentStats(
        creatorId,
        'post',
        from.toISOString().slice(0, 10),
        to.toISOString().slice(0, 10),
        communityScope.ga4CommunityId,
      );
      if (ga4Stats.length > 0) {
        byPost.length = 0;
        for (const s of ga4Stats) {
          byPost.push({
            contentId: s.contentId,
            views: s.views,
            likes: s.likes,
            shares: s.shares,
            bookmarks: s.bookmarks,
            ratingsCount: s.ratingsCount,
          });
        }
        byPost.sort((a: any, b: any) => Number(b.views || 0) - Number(a.views || 0));
      }
    } catch {
      // Keep Mongo aggregate
    }
    this.setCache(key, { byPost });
    return { byPost };
  }

  // Build daily rollups for a specific creator and day (UTC boundaries)
  async rollupDayForCreator(
    creatorId: string,
    day: Date,
    options?: { skipInvalidation?: boolean },
  ) {
    const start = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 23, 59, 59, 999));

    const tracking = this.dbConnection.collection('trackingactions');

    // Helper to build aggregate for a specific type
    const buildTypeAgg = async (type: string, collectionName: string) => {
      const chapterIdExpr = { $ifNull: ['$metadata.chapterId', ''] };
      const creatorFieldPath = type === 'post' ? 'meta.authorId' : 'meta.creatorId';
      const completesCondition =
        type === 'course'
          ? {
              $and: [
                { $eq: ['$actionType', TrackingActionType.COMPLETE] },
                { $eq: [chapterIdExpr, ''] },
              ],
            }
          : { $eq: ['$actionType', TrackingActionType.COMPLETE] };
      const chapterCompletesCondition =
        type === 'course'
          ? {
              $or: [
                { $eq: ['$actionType', TrackingActionType.CHAPTER_COMPLETE] },
                {
                  $and: [
                    { $eq: ['$actionType', TrackingActionType.COMPLETE] },
                    { $ne: [chapterIdExpr, ''] },
                  ],
                },
              ],
            }
          : false;

      return tracking.aggregate([
        { $match: { timestamp: { $gte: start, $lte: end }, contentType: type } },
        { $lookup: { from: collectionName, localField: 'contentId', foreignField: 'id', as: 'meta' } },
        { $unwind: { path: '$meta', preserveNullAndEmptyArrays: false } },
        { $match: { [creatorFieldPath]: new Types.ObjectId(creatorId) } },
        {
          $group: {
            _id: { contentId: '$contentId' },
            communityId: { $first: '$meta.communityId' },
            views: { $sum: { $cond: [{ $eq: ['$actionType', 'view'] }, 1, 0] } },
            starts: { $sum: { $cond: [{ $eq: ['$actionType', 'start'] }, 1, 0] } },
            completes: { $sum: { $cond: [completesCondition, 1, 0] } },
            chapterCompletes: { $sum: { $cond: [chapterCompletesCondition, 1, 0] } },
            likes: { $sum: { $cond: [{ $eq: ['$actionType', 'like'] }, 1, 0] } },
            shares: { $sum: { $cond: [{ $eq: ['$actionType', 'share'] }, 1, 0] } },
            downloads: { $sum: { $cond: [{ $eq: ['$actionType', 'download'] }, 1, 0] } },
            bookmarks: { $sum: { $cond: [{ $eq: ['$actionType', 'bookmark'] }, 1, 0] } },
            ratingsCount: { $sum: { $cond: [{ $eq: ['$actionType', 'rate'] }, 1, 0] } },
            users: { $addToSet: '$userId' },
          },
        },
        { $project: { _id: 0, contentId: '$_id.contentId', communityId: 1, views: 1, starts: 1, completes: 1, chapterCompletes: 1, likes: 1, shares: 1, downloads: 1, bookmarks: 1, ratingsCount: 1, uniqueUsers: { $size: '$users' } } },
      ]).toArray();
    };

    const courseAgg = await buildTypeAgg('course', 'cours');
    const challengeAgg = await buildTypeAgg('challenge', 'challenges');
    const sessionAgg = await buildTypeAgg('session', 'sessions');
    const eventAgg = await buildTypeAgg('event', 'events');
    const productAgg = await buildTypeAgg('product', 'products');
    const postAgg = await buildTypeAgg('post', 'posts');

    const docs: any[] = [];
    courseAgg.forEach(c => docs.push({ creatorId: new Types.ObjectId(creatorId), contentType: 'course', ...c, date: start }));
    challengeAgg.forEach(c => docs.push({ creatorId: new Types.ObjectId(creatorId), contentType: 'challenge', ...c, date: start }));
    sessionAgg.forEach(c => docs.push({ creatorId: new Types.ObjectId(creatorId), contentType: 'session', ...c, date: start }));
    eventAgg.forEach(c => docs.push({ creatorId: new Types.ObjectId(creatorId), contentType: 'event', ...c, date: start }));
    productAgg.forEach(c => docs.push({ creatorId: new Types.ObjectId(creatorId), contentType: 'product', ...c, date: start }));
    postAgg.forEach(c => docs.push({ creatorId: new Types.ObjectId(creatorId), contentType: 'post', ...c, date: start }));

    for (const d of docs) {
      await this.dailyModel.updateOne(
        { creatorId: d.creatorId, contentType: d.contentType, contentId: d.contentId, date: d.date },
        { $set: d },
        { upsert: true },
      );
    }

    if (!options?.skipInvalidation) {
      await this.invalidateCreatorCache(creatorId);
    }
    return {
      updated: docs.length,
      date: start.toISOString(),
      byType: {
        course: courseAgg.length,
        challenge: challengeAgg.length,
        session: sessionAgg.length,
        event: eventAgg.length,
        product: productAgg.length,
        post: postAgg.length,
      },
    };
  }

  async backfillForCreator(creatorId: string, days: number = 90) {
    const completionBackfill = await this.backfillCourseCompletionEventsForCreator(creatorId, days);

    const today = new Date();
    let count = 0;
    let postCount = 0;
    for (let i = days; i >= 0; i--) {
      const day = new Date(today.getTime() - i * 24 * 3600 * 1000);
      const r = await this.rollupDayForCreator(creatorId, day, { skipInvalidation: true });
      count += r.updated;
      postCount += Number(r.byType?.post || 0);
    }
    await this.invalidateCreatorCache(creatorId);
    this.logger.log(
      `Analytics backfill completed for creator=${creatorId}; days=${days}; updated=${count}; postRows=${postCount}; courseCompletionEventsBackfilled=${completionBackfill.inserted}`,
    );
    return {
      ok: true,
      updated: count,
      postRollupUpdated: postCount,
      postsBackfilledDays: days,
      courseCompletionEventsBackfilled: completionBackfill.inserted,
      completionDaysTouched: completionBackfill.daysTouched,
    };
  }

  private async backfillCourseCompletionEventsForCreator(creatorId: string, days: number) {
    const creatorObjectId = this.getCreatorObjectId(creatorId);
    const from = new Date(Date.now() - Math.max(1, days) * 24 * 3600 * 1000);

    const courses = await this.dbConnection.db
      ?.collection('cours')
      .find({ creatorId: creatorObjectId })
      .project({ _id: 1, id: 1, sections: 1 })
      .toArray() || [];

    if (!courses.length) {
      return { inserted: 0, daysTouched: 0 };
    }

    const courseMap = new Map<string, { trackingId: string; totalChapters: number }>();
    const courseObjectIds: Types.ObjectId[] = [];
    for (const course of courses) {
      const mongoId = String(course._id);
      const totalChapters = Array.isArray(course.sections)
        ? course.sections.reduce(
            (acc: number, section: any) => acc + (Array.isArray(section?.chapitres) ? section.chapitres.length : 0),
            0,
          )
        : 0;
      courseMap.set(mongoId, {
        trackingId: String(course.id || course._id),
        totalChapters,
      });
      courseObjectIds.push(course._id);
    }

    const enrollments = await this.dbConnection.db
      ?.collection('courseenrollments')
      .find({
        isActive: true,
        courseId: { $in: courseObjectIds },
        updatedAt: { $gte: from },
      })
      .project({ _id: 1, userId: 1, courseId: 1, progression: 1, completedAt: 1, updatedAt: 1, enrolledAt: 1 })
      .toArray() || [];

    const trackingCollection = this.dbConnection.collection('trackingactions');
    const contentProgressCollection = this.dbConnection.collection('contentprogresses');
    let inserted = 0;
    const touchedDays = new Set<string>();

    for (const enrollment of enrollments) {
      const courseMeta = courseMap.get(String(enrollment.courseId));
      if (!courseMeta || courseMeta.totalChapters <= 0) continue;

      const completedChapters = Array.isArray(enrollment.progression)
        ? enrollment.progression.filter((p: any) => Boolean(p?.isCompleted)).length
        : 0;
      if (completedChapters < courseMeta.totalChapters) continue;

      const rawUserId = String(enrollment.userId || '');
      if (!(enrollment.userId instanceof Types.ObjectId) && !Types.ObjectId.isValid(rawUserId)) {
        continue;
      }
      const userId = enrollment.userId instanceof Types.ObjectId
        ? enrollment.userId
        : new Types.ObjectId(rawUserId);
      const completionDate = new Date(
        enrollment.completedAt || enrollment.updatedAt || enrollment.enrolledAt || Date.now(),
      );

      const existingComplete = await trackingCollection.findOne({
        userId,
        contentType: 'course',
        contentId: courseMeta.trackingId,
        actionType: 'complete',
        $or: [
          { 'metadata.chapterId': { $exists: false } },
          { 'metadata.chapterId': '' },
          { 'metadata.chapterId': null },
        ],
      });

      if (existingComplete) continue;

      await trackingCollection.insertOne({
        id: new Types.ObjectId().toString(),
        userId,
        contentId: courseMeta.trackingId,
        contentType: 'course',
        actionType: 'complete',
        metadata: {
          source: 'analytics_backfill_course_completion',
          autoFromChapterCompletion: true,
          backfilled: true,
        },
        timestamp: completionDate,
      });

      await contentProgressCollection.updateOne(
        {
          userId,
          contentType: 'course',
          contentId: courseMeta.trackingId,
        },
        {
          $set: {
            isCompleted: true,
            completedAt: completionDate,
            lastAccessedAt: completionDate,
          },
          $setOnInsert: {
            id: new Types.ObjectId().toString(),
            metadata: {},
            watchTime: 0,
            viewCount: 0,
            likeCount: 0,
            shareCount: 0,
            downloadCount: 0,
            bookmarks: [],
          },
        },
        { upsert: true },
      );

      inserted += 1;
      const dayKey = new Date(Date.UTC(
        completionDate.getUTCFullYear(),
        completionDate.getUTCMonth(),
        completionDate.getUTCDate(),
      )).toISOString();
      touchedDays.add(dayKey);
    }

    return { inserted, daysTouched: touchedDays.size };
  }

  private isMeaningfulDeviceValue(device: string | undefined | null): boolean {
    const value = (device || '').trim().toLowerCase();
    return (
      value !== '' &&
      value !== 'unknown' &&
      value !== '(not set)' &&
      value !== 'not set' &&
      value !== '(not provided)' &&
      value !== 'undefined' &&
      value !== 'null'
    );
  }

  private normalizeText(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeIpAddress(value: unknown): string | null {
    const raw = this.normalizeText(value);
    if (!raw) return null;
    const candidate = raw.split(',')[0]?.trim();
    if (!candidate) return null;
    return candidate.startsWith('::ffff:') ? candidate.slice(7) : candidate;
  }

  private extractDeviceModelFromUserAgent(userAgent: string | null): string | null {
    if (!userAgent) return null;

    const iosMatch = userAgent.match(/\((iPhone|iPad|iPod)[^)]*\)/i);
    if (iosMatch?.[1]) return iosMatch[1];

    const androidBuildMatch = userAgent.match(/Android[^;)]*;\s*([^;)]+?)\s*Build\//i);
    if (androidBuildMatch?.[1]) return androidBuildMatch[1].trim();

    const androidGenericMatch = userAgent.match(/Android[^;)]*;\s*([^;)]+?)\)/i);
    if (androidGenericMatch?.[1]) return androidGenericMatch[1].trim();

    if (/\bMacintosh\b/i.test(userAgent)) return 'Mac';
    if (/\bWindows\b/i.test(userAgent)) return 'Windows PC';

    return null;
  }

  private buildTrackingScopePipeline(
    creatorId: string,
    from: Date | null,
    to: Date | null,
    communityScope: { hasFilter: boolean; lookupCommunityValues: Array<string | Types.ObjectId> },
  ) {
    const contentLookup = (fromCollection: string, as: string) => ({
      $lookup: {
        from: fromCollection,
        let: { trackingContentId: '$contentId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ['$id', '$$trackingContentId'] },
                  { $eq: [{ $toString: '$_id' }, '$$trackingContentId'] },
                ],
              },
            },
          },
          {
            $project: {
              _id: 1,
              id: 1,
              creatorId: 1,
              authorId: 1,
              communityId: 1,
            },
          },
          { $limit: 1 },
        ],
        as,
      },
    });

    const contentDoc = {
      $ifNull: [
        { $arrayElemAt: ['$course', 0] },
        {
          $ifNull: [
            { $arrayElemAt: ['$challenge', 0] },
            {
              $ifNull: [
                { $arrayElemAt: ['$session', 0] },
                {
                  $ifNull: [
                    { $arrayElemAt: ['$event', 0] },
                    {
                      $ifNull: [
                        { $arrayElemAt: ['$product', 0] },
                        { $arrayElemAt: ['$post', 0] },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const pipeline: any[] = [];
    if (from && to) {
      pipeline.push({ $match: { timestamp: { $gte: from, $lte: to } } });
    }

    pipeline.push(
      contentLookup('cours', 'course'),
      contentLookup('challenges', 'challenge'),
      contentLookup('sessions', 'session'),
      contentLookup('events', 'event'),
      contentLookup('products', 'product'),
      contentLookup('posts', 'post'),
      { $addFields: { contentDoc } },
      { $addFields: { creatorIdResolved: { $ifNull: ['$contentDoc.creatorId', '$contentDoc.authorId'] } } },
      { $match: { creatorIdResolved: this.getCreatorObjectId(creatorId) } },
    );

    if (communityScope.hasFilter) {
      pipeline.push({ $match: this.buildLookupCommunityMatch('contentDoc.communityId', communityScope.lookupCommunityValues) });
    }

    return pipeline;
  }

  private async resolveLatestKnownIps(
    tracking: any,
    creatorId: string,
    communityScope: { hasFilter: boolean; lookupCommunityValues: Array<string | Types.ObjectId> },
    userIds: string[],
  ): Promise<Map<string, string>> {
    const normalizedUserIds = Array.from(new Set(userIds.filter((value) => Types.ObjectId.isValid(value))));
    if (!normalizedUserIds.length) return new Map();

    const objectIds = normalizedUserIds.map((value) => new Types.ObjectId(value));
    const basePipeline = this.buildTrackingScopePipeline(creatorId, null, null, communityScope);

    const rows = await tracking.aggregate([
      ...basePipeline,
      { $match: { userId: { $in: objectIds } } },
      {
        $project: {
          userId: 1,
          timestamp: 1,
          ipAddress: {
            $ifNull: [
              '$metadata.ipAddress',
              {
                $ifNull: [
                  '$metadata.ip',
                  {
                    $ifNull: [
                      '$metadata.clientIp',
                      {
                        $ifNull: ['$metadata.remoteIp', '$metadata.ip_address'],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $match: {
          ipAddress: {
            $nin: [null, '', 'unknown', '(not set)', 'not set', '(not provided)', 'undefined', 'null'],
          },
        },
      },
      { $sort: { timestamp: -1 } },
      { $group: { _id: '$userId', ipAddress: { $first: '$ipAddress' } } },
      { $project: { _id: 0, userId: '$_id', ipAddress: 1 } },
    ]).toArray();

    const map = new Map<string, string>();
    rows.forEach((row: any) => {
      const userId = row?.userId ? row.userId.toString() : null;
      const ipAddress = this.normalizeIpAddress(row?.ipAddress);
      if (userId && ipAddress) {
        map.set(userId, ipAddress);
      }
    });

    return map;
  }

  private buildDeviceAggregatePipeline(basePipeline: any[]) {
    return [
      ...basePipeline,
      { $addFields: { uaLower: { $toLower: { $ifNull: ['$metadata.userAgent', ''] } } } },
      {
        $project: {
          userId: 1,
          device: {
            $ifNull: [
              '$metadata.device',
              {
                $cond: [
                  {
                    $or: [
                      { $regexMatch: { input: '$uaLower', regex: 'ipad|tablet|playbook|silk' } },
                      {
                        $and: [
                          { $regexMatch: { input: '$uaLower', regex: 'android' } },
                          { $not: [{ $regexMatch: { input: '$uaLower', regex: 'mobile' } }] },
                        ],
                      },
                    ],
                  },
                  'tablet',
                  {
                    $cond: [
                      { $regexMatch: { input: '$uaLower', regex: 'mobi|iphone|ipod|iemobile|blackberry|kindle|opera mini|windows phone|android' } },
                      'mobile',
                      'desktop',
                    ],
                  },
                ],
              },
            ],
          },
          os: { $ifNull: ['$metadata.os', 'unknown'] },
          browser: { $ifNull: ['$metadata.browser', 'unknown'] },
        },
      },
      { $group: { _id: { device: '$device', os: '$os', browser: '$browser', userId: '$userId' } } },
      { $group: { _id: { device: '$_id.device', os: '$_id.os', browser: '$_id.browser' }, count: { $sum: 1 } } },
      { $project: { _id: 0, device: '$_id.device', os: '$_id.os', browser: '$_id.browser', count: 1 } },
      { $sort: { count: -1 } },
    ];
  }

  private buildDeviceDetailsPipeline(basePipeline: any[]) {
    return [
      ...basePipeline,
      { $addFields: { uaLower: { $toLower: { $ifNull: ['$metadata.userAgent', ''] } } } },
      {
        $project: {
          userId: 1,
          timestamp: 1,
          userAgent: { $ifNull: ['$metadata.userAgent', null] },
          device: {
            $ifNull: [
              '$metadata.device',
              {
                $cond: [
                  {
                    $or: [
                      { $regexMatch: { input: '$uaLower', regex: 'ipad|tablet|playbook|silk' } },
                      {
                        $and: [
                          { $regexMatch: { input: '$uaLower', regex: 'android' } },
                          { $not: [{ $regexMatch: { input: '$uaLower', regex: 'mobile' } }] },
                        ],
                      },
                    ],
                  },
                  'tablet',
                  {
                    $cond: [
                      { $regexMatch: { input: '$uaLower', regex: 'mobi|iphone|ipod|iemobile|blackberry|kindle|opera mini|windows phone|android' } },
                      'mobile',
                      'desktop',
                    ],
                  },
                ],
              },
            ],
          },
          os: { $ifNull: ['$metadata.os', 'unknown'] },
          browser: { $ifNull: ['$metadata.browser', 'unknown'] },
          ipAddress: {
            $ifNull: [
              '$metadata.ipAddress',
              {
                $ifNull: [
                  '$metadata.ip',
                  { $ifNull: ['$metadata.clientIp', '$metadata.remoteIp'] },
                ],
              },
            ],
          },
          deviceModel: {
            $ifNull: [
              '$metadata.deviceModel',
              { $ifNull: ['$metadata.model', '$metadata.device_name'] },
            ],
          },
        },
      },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: {
            userId: '$userId',
            device: '$device',
            os: '$os',
            browser: '$browser',
            ipAddress: '$ipAddress',
          },
          lastSeenAt: { $first: '$timestamp' },
          eventsCount: { $sum: 1 },
          userAgent: { $first: '$userAgent' },
          deviceModel: { $first: '$deviceModel' },
        },
      },
      { $lookup: { from: 'users', localField: '_id.userId', foreignField: '_id', as: 'user' } },
      { $addFields: { user: { $arrayElemAt: ['$user', 0] } } },
      {
        $project: {
          _id: 0,
          userId: '$_id.userId',
          userName: '$user.name',
          userEmail: '$user.email',
          device: '$_id.device',
          os: '$_id.os',
          browser: '$_id.browser',
          ipAddress: '$_id.ipAddress',
          lastSeenAt: 1,
          eventsCount: 1,
          userAgent: 1,
          deviceModel: 1,
        },
      },
      { $sort: { lastSeenAt: -1 } },
      { $limit: 100 },
    ];
  }

  private async queryTrackingDeviceDetails(tracking: any, pipeline: any[]) {
    const rawRows = await tracking.aggregate(pipeline).toArray();
    return rawRows.map((entry: any) => {
      const userAgent = this.normalizeText(entry?.userAgent);
      const explicitModel = this.normalizeText(entry?.deviceModel);
      const inferredModel = this.extractDeviceModelFromUserAgent(userAgent);
      const deviceModel = explicitModel || inferredModel;
      return {
        userId: entry?.userId ? entry.userId.toString() : null,
        userName: this.normalizeText(entry?.userName),
        userEmail: this.normalizeText(entry?.userEmail),
        device: this.normalizeText(entry?.device),
        deviceModel,
        os: this.normalizeText(entry?.os),
        browser: this.normalizeText(entry?.browser),
        ipAddress: this.normalizeIpAddress(entry?.ipAddress),
        lastSeenAt: entry?.lastSeenAt || null,
        eventsCount: Number(entry?.eventsCount || 0),
      };
    });
  }

  async getDevices(creatorId: string, from: Date, to: Date, communityId?: string, communitySlug?: string) {
    const communityScope = await this.resolveCommunityScope(creatorId, communityId, communitySlug);
    const key = this.cacheKey(creatorId, from.toISOString(), to.toISOString(), `devices:${communityScope.cacheKeyPart}`);
    const cached = await this.getCache<any>(key);
    if (cached) return cached;

    const tracking = this.dbConnection.collection('trackingactions');
    const queryTracking = async () => {
      const basePipeline = this.buildTrackingScopePipeline(creatorId, from, to, communityScope);
      let rows = await tracking.aggregate(this.buildDeviceAggregatePipeline(basePipeline)).toArray();
      const meaningfulRows = rows.filter((row: any) => this.isMeaningfulDeviceValue(row?.device));
      if (meaningfulRows.length > 0) {
        rows = meaningfulRows;
      }
      let details = await this.queryTrackingDeviceDetails(
        tracking,
        this.buildDeviceDetailsPipeline(basePipeline),
      );

      const userIdsMissingIp = details
        .filter((entry: any) => !entry?.ipAddress && typeof entry?.userId === 'string')
        .map((entry: any) => entry.userId as string);

      if (userIdsMissingIp.length > 0) {
        const fallbackIps = await this.resolveLatestKnownIps(
          tracking,
          creatorId,
          communityScope,
          userIdsMissingIp,
        );
        details = details.map((entry: any) => {
          if (entry?.ipAddress || !entry?.userId) return entry;
          const fallbackIp = fallbackIps.get(entry.userId);
          if (!fallbackIp) return entry;
          return {
            ...entry,
            ipAddress: fallbackIp,
          };
        });
      }

      return { rows, details };
    };

    let trackingResult = await queryTracking();

    let ga4Rows: any[] | null = null;
    try {
      const ga4Devices = await this.ga4ReportingService.getCreatorDevices(
        creatorId,
        from.toISOString().slice(0, 10),
        to.toISOString().slice(0, 10),
        communityScope.ga4CommunityId,
      );

      const meaningful = ga4Devices.filter((device) => this.isMeaningfulDeviceValue(device.device));
      if (meaningful.length > 0) {
        ga4Rows = meaningful.map((device) => ({
          device: device.device,
          count: device.count,
        }));
      }
    } catch {
      // Ignore GA4 errors and rely on Mongo tracking data.
    }

    if (!ga4Rows?.length && !trackingResult.rows.length && !trackingResult.details.length) {
      await this.backfillForCreator(creatorId, 90);
      trackingResult = await queryTracking();
    }

    const result = {
      rows: ga4Rows?.length ? ga4Rows : trackingResult.rows,
      details: trackingResult.details,
    };

    this.setCache(key, result, 60 * 1000);
    return result;
  }

  private isMeaningfulAttributionValue(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    const normalized = value.trim().toLowerCase();
    return (
      normalized !== '' &&
      normalized !== 'unknown' &&
      normalized !== '(not set)' &&
      normalized !== 'not set' &&
      normalized !== '(not provided)' &&
      normalized !== '(none)' &&
      normalized !== 'none' &&
      normalized !== 'undefined' &&
      normalized !== 'null' &&
      normalized !== 'n/a'
    );
  }

  private normalizeAttributionValue(value: unknown): string | null {
    if (!this.isMeaningfulAttributionValue(value)) return null;
    return (value as string).trim();
  }

  private extractReferrerDomain(referrer: string | null): string | null {
    if (!referrer) return null;
    const raw = referrer.trim();
    if (!raw) return null;
    if (raw.toLowerCase() === 'direct' || raw.toLowerCase() === '(direct)') return null;

    const normalizeHost = (host: string): string | null => {
      const normalizedHost = host.trim().toLowerCase().replace(/^www\./, '');
      return normalizedHost.length > 0 ? normalizedHost : null;
    };

    try {
      const url = new URL(raw);
      return normalizeHost(url.hostname);
    } catch {
      // Ignore, try to coerce host below.
    }

    try {
      const url = new URL(`https://${raw}`);
      return normalizeHost(url.hostname);
    } catch {
      // Ignore, fallback below.
    }

    if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(raw)) {
      return normalizeHost(raw);
    }

    return null;
  }

  private resolveReferrerChannel(input: {
    domain: string | null;
    utmSource: string | null;
    utmMedium: string | null;
    rawReferrer: string | null;
  }): 'direct' | 'search' | 'social' | 'email' | 'paid' | 'referral' {
    const domain = (input.domain || '').toLowerCase();
    const source = (input.utmSource || '').toLowerCase();
    const medium = (input.utmMedium || '').toLowerCase();
    const referrer = (input.rawReferrer || '').toLowerCase();

    const hasDirectHint =
      source === 'direct' ||
      source === '(direct)' ||
      medium === 'direct' ||
      referrer === 'direct' ||
      referrer === '(direct)';
    if (hasDirectHint || (!domain && !source && !medium && !referrer)) return 'direct';

    if (
      /email|newsletter/.test(medium) ||
      /email|newsletter/.test(source) ||
      domain.includes('mail.google.com')
    ) {
      return 'email';
    }

    if (/cpc|ppc|paid|display|affiliate|sponsored/.test(medium)) return 'paid';

    const socialDomains = [
      'facebook.com',
      'instagram.com',
      'linkedin.com',
      'twitter.com',
      'x.com',
      'tiktok.com',
      'youtube.com',
      'reddit.com',
      'pinterest.com',
      'snapchat.com',
      'telegram.org',
      't.me',
      'discord.com',
      'whatsapp.com',
    ];
    if (
      /social/.test(medium) ||
      socialDomains.some((value) => domain.endsWith(value)) ||
      /facebook|instagram|linkedin|twitter|x|tiktok|youtube|reddit|pinterest|snapchat|telegram|discord|whatsapp/.test(source)
    ) {
      return 'social';
    }

    const searchDomains = ['google.', 'bing.com', 'duckduckgo.com', 'yahoo.', 'baidu.com', 'yandex.', 'ecosia.org'];
    if (
      /organic|search|seo/.test(medium) ||
      searchDomains.some((value) => domain.includes(value)) ||
      /google|bing|duckduckgo|yahoo|baidu|yandex|ecosia/.test(source)
    ) {
      return 'search';
    }

    return 'referral';
  }

  private resolveReferrerSourceName(input: {
    domain: string | null;
    utmSource: string | null;
    rawReferrer: string | null;
  }): string {
    if (input.domain) return input.domain;
    if (input.utmSource) return input.utmSource;
    if (input.rawReferrer) return input.rawReferrer;
    return 'Direct';
  }

  private formatReferrerRows(rows: any[]) {
    return rows
      .map((row: any) => {
        const rawReferrer = this.normalizeAttributionValue(row?.referrer);
        const utmSource = this.normalizeAttributionValue(row?.utm_source);
        const utmMedium = this.normalizeAttributionValue(row?.utm_medium);
        const utmCampaign = this.normalizeAttributionValue(row?.utm_campaign);
        const domain = this.extractReferrerDomain(rawReferrer);
        const channel = this.resolveReferrerChannel({
          domain,
          utmSource,
          utmMedium,
          rawReferrer,
        });
        const source = this.resolveReferrerSourceName({
          domain,
          utmSource,
          rawReferrer,
        });
        const count = Number(row?.count || 0);
        const uniqueUsers = Number.isFinite(Number(row?.uniqueUsers))
          ? Number(row?.uniqueUsers)
          : undefined;
        const lastSeenAt = row?.lastSeenAt || null;

        return {
          source,
          channel,
          domain,
          referrer: rawReferrer,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          count,
          uniqueUsers,
          lastSeenAt,
        };
      })
      .filter((row: any) => row.count > 0)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 50);
  }

  private summarizeReferrerRows(rows: any[], provider: 'ga4' | 'tracking') {
    const totalEvents = rows.reduce((acc: number, row: any) => acc + Number(row?.count || 0), 0);
    const channelTotals = rows.reduce((acc: Record<string, number>, row: any) => {
      const channel = row?.channel || 'referral';
      acc[channel] = (acc[channel] || 0) + Number(row?.count || 0);
      return acc;
    }, {});

    const topChannel = (Object.entries(channelTotals) as Array<[string, number]>)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      provider,
      totalEvents,
      sources: rows.length,
      topChannel,
      topSource: rows[0]?.source || null,
    };
  }

  async getReferrers(creatorId: string, from: Date, to: Date, communityId?: string, communitySlug?: string) {
    const communityScope = await this.resolveCommunityScope(creatorId, communityId, communitySlug);
    const key = this.cacheKey(creatorId, from.toISOString(), to.toISOString(), `referrers:${communityScope.cacheKeyPart}`);
    const cached = await this.getCache<any>(key);
    if (cached) return cached;

    // Try GA4 first
    try {
      const ga4Referrers = await this.ga4ReportingService.getCreatorReferrers(
        creatorId,
        from.toISOString().slice(0, 10),
        to.toISOString().slice(0, 10),
        communityScope.ga4CommunityId
      );
      if (ga4Referrers.length > 0) {
        const rows = this.formatReferrerRows(ga4Referrers.map(r => ({
          referrer: r.referrer,
          count: r.count,
          utm_source: null,
          utm_medium: null,
          utm_campaign: null,
        })));
        if (rows.length > 0) {
          const result = { rows, summary: this.summarizeReferrerRows(rows, 'ga4') };
          this.setCache(key, result, 60 * 1000);
          return result;
        }
      }
    } catch (e) {
      // Ignore
    }

    const tracking = this.dbConnection.collection('trackingactions');

    const buildPipeline = () => {
      const basePipeline = this.buildTrackingScopePipeline(creatorId, from, to, communityScope);
      return [
        ...basePipeline,
        {
          $project: {
            userId: 1,
            timestamp: 1,
            referrer: '$metadata.referrer',
            utm_source: '$metadata.utm_source',
            utm_medium: '$metadata.utm_medium',
            utm_campaign: '$metadata.utm_campaign',
          },
        },
        {
          $group: {
            _id: {
              referrer: '$referrer',
              utm_source: '$utm_source',
              utm_medium: '$utm_medium',
              utm_campaign: '$utm_campaign',
            },
            count: { $sum: 1 },
            users: { $addToSet: '$userId' },
            lastSeenAt: { $max: '$timestamp' },
          },
        },
        {
          $project: {
            _id: 0,
            referrer: '$_id.referrer',
            utm_source: '$_id.utm_source',
            utm_medium: '$_id.utm_medium',
            utm_campaign: '$_id.utm_campaign',
            count: 1,
            uniqueUsers: { $size: '$users' },
            lastSeenAt: 1,
          },
        },
        { $sort: { count: -1 } },
        { $limit: 100 },
      ];
    };

    let rows = await tracking.aggregate(buildPipeline()).toArray();

    if (!rows.length) {
      await this.backfillForCreator(creatorId, 90);
      rows = await tracking.aggregate(buildPipeline()).toArray();
    }

    const formattedRows = this.formatReferrerRows(rows);
    const result = {
      rows: formattedRows,
      summary: this.summarizeReferrerRows(formattedRows, 'tracking'),
    };

    this.setCache(key, result, 60 * 1000);
    return result;
  }

  async exportCsv(creatorId: string, scope: 'overview' | 'courses' | 'challenges' | 'sessions' | 'events' | 'products' | 'posts', from: Date, to: Date, communityId?: string, communitySlug?: string) {
    // CSV export: enforce Pro-only when plan enforcement is active
    const enforcementOn = process.env.PLAN_ENFORCEMENT_MODE === 'true';
    if (enforcementOn) {
      const sub = await this.subscriptionService.getMySubscription(creatorId);
      const plan = (sub?.plan as PlanTier) || PlanTier.STARTER;
      if (plan !== PlanTier.PRO) {
        throw new ForbiddenException('CSV export is available on the Pro plan only. Please upgrade.');
      }
    }
    // Clamp date range to plan lookback window
    const clamped = await this.clampDateRangeForPlan(creatorId, from, to);
    from = clamped.from;
    to = clamped.to;

    if (scope === 'overview') {
      const data = await this.getOverview(creatorId, from, to, PlanTier.PRO, communityId, communitySlug);
      const rows = [
        ['metric', 'value'],
        ['views', data.totals.views],
        ['starts', data.totals.starts],
        ['completes', data.totals.completes],
        ['chapterCompletes', data.totals.chapterCompletes],
        ['likes', data.totals.likes],
        ['shares', data.totals.shares],
        ['downloads', data.totals.downloads],
        ['bookmarks', data.totals.bookmarks],
        ['watchTime', data.totals.watchTime],
        ['ratingsCount', data.totals.ratingsCount],
        ['revenue', data.revenue.total],
        ['salesCount', data.revenue.count],
        ['engagementRate', data.engagementRate],
      ];
      return { filename: 'overview.csv', csv: this.toCsv(rows) };
    }

    if (scope === 'courses') {
      const res = await this.getCourses(creatorId, from, to, communityId, communitySlug);
      const head = ['contentId', 'views', 'starts', 'completes', 'chapterCompletes', 'completionRate', 'watchTime', 'ratingsCount'];
      const rows = [head, ...res.byCourse.map((c: any) => [c.contentId, c.views, c.starts, c.completes, c.chapterCompletes || 0, c.completionRate, c.watchTime, c.ratingsCount])];
      return { filename: 'courses.csv', csv: this.toCsv(rows) };
    }

    if (scope === 'challenges') {
      const res = await this.getChallenges(creatorId, from, to, communityId, communitySlug);
      const head = ['contentId', 'views', 'starts', 'completes', 'completionRate'];
      const rows = [head, ...res.byChallenge.map((c: any) => [c.contentId, c.views, c.starts, c.completes, c.completionRate])];
      return { filename: 'challenges.csv', csv: this.toCsv(rows) };
    }

    if (scope === 'sessions') {
      const res = await this.getSessions(creatorId, from, to, communityId, communitySlug);
      const head = ['contentId', 'views', 'starts', 'completes', 'completionRate'];
      const rows = [head, ...res.bySession.map((c: any) => [c.contentId, c.views, c.starts, c.completes, c.completionRate])];
      return { filename: 'sessions.csv', csv: this.toCsv(rows) };
    }

    if (scope === 'events') {
      const res = await this.getEvents(creatorId, from, to, communityId, communitySlug);
      const head = ['contentId', 'views', 'starts', 'completes'];
      const rows = [head, ...res.byEvent.map((c: any) => [c.contentId, c.views, c.starts, c.completes])];
      return { filename: 'events.csv', csv: this.toCsv(rows) };
    }

    if (scope === 'products') {
      const res = await this.getProducts(creatorId, from, to, communityId, communitySlug);
      const head = ['contentId', 'views', 'likes', 'shares', 'downloads'];
      const rows = [head, ...res.byProduct.map((c: any) => [c.contentId, c.views, c.likes, c.shares, c.downloads])];
      return { filename: 'products.csv', csv: this.toCsv(rows) };
    }

    // posts
    const res = await this.getPosts(creatorId, from, to, communityId, communitySlug);
    const head = ['contentId', 'views', 'likes', 'shares', 'bookmarks', 'ratingsCount'];
    const rows = [head, ...res.byPost.map((c: any) => [c.contentId, c.views, c.likes, c.shares, c.bookmarks, c.ratingsCount])];
    return { filename: 'posts.csv', csv: this.toCsv(rows) };
  }

  private toCsv(rows: (string | number)[][]) {
    return rows.map(r => r.map(v => (v === null || v === undefined) ? '' : String(v).replace(/"/g, '""')).map(v => /[",\n]/.test(v) ? `"${v}"` : v).join(',')).join('\n');
  }

  private shapeOverview(full: any, plan: PlanTier) {
    const baseData = {
      totals: full.totals,
      revenue: full.revenue,
      avgEngagement: full.engagementRate,
      engagementRate: full.engagementRate,
    };

    // Always return full data regardless of plan
    return {
      ...baseData,
      views: Number(full?.totals?.views ?? 0) || 0,
      viewsTotal: Number(full?.totals?.views ?? 0) || 0,
      starts: Number(full?.totals?.starts ?? 0) || 0,
      // Guardrail: course-level completion events only (not chapter completion events).
      completes: Number(full?.totals?.completes ?? 0) || 0,
      courseCompletes: Number(full?.totals?.completes ?? 0) || 0,
      chapterCompletes: Number(full?.totals?.chapterCompletes ?? 0) || 0,
      completions: Number(full?.totals?.completes ?? 0) || 0,
      completionRate:
        (Number(full?.totals?.starts ?? 0) || 0) > 0
          ? ((Number(full?.totals?.completes ?? 0) || 0) / (Number(full?.totals?.starts ?? 0) || 0)) * 100
          : 0,
      avgDuration:
        (Number(full?.totals?.starts ?? 0) || 0) > 0
          ? Math.round((Number(full?.totals?.watchTime ?? 0) / (Number(full?.totals?.starts ?? 0) || 1)) / 60)
          : 0,
      averageDuration:
        (Number(full?.totals?.starts ?? 0) || 0) > 0
          ? Math.round((Number(full?.totals?.watchTime ?? 0) / (Number(full?.totals?.starts ?? 0) || 1)) / 60)
          : 0,
      trend7d: full.trend.slice(-7),
      trend28d: full.trend.slice(-28),
      trendAll: full.trend,
      topContents: full.topContents,
      meta: full.meta,
    };
  }

  private getFunnelMinStarts(): number {
    const raw = Number(process.env.ANALYTICS_FUNNEL_MIN_STARTS || 30);
    if (!Number.isFinite(raw)) return 30;
    return Math.max(1, Math.min(100000, Math.floor(raw)));
  }

  private round4(value: number): number {
    return Math.round(value * 10000) / 10000;
  }

  private buildDropOffSummary(params: {
    steps: Array<{ stepKey: string; stepLabel: string; uniqueUsers?: number; events?: number }>;
    minStarts: number;
    sampleSizeKey?: string;
  }): {
    worstStep: { stepKey: string; stepLabel: string; dropOffRate: number; fromUsers: number; toUsers: number } | null;
    dropOffRate: number;
    sampleSizeWarnings: string[];
  } {
    const { steps, minStarts } = params;
    const sampleSizeWarnings: string[] = [];

    // compute per-step drop-off against previous step
    const candidates: Array<{ idx: number; fromUsers: number; toUsers: number; dropOffRate: number }> = [];
    for (let i = 1; i < steps.length; i++) {
      const prev = Number(steps[i - 1]?.uniqueUsers ?? 0);
      const curr = Number(steps[i]?.uniqueUsers ?? 0);
      if (!Number.isFinite(prev) || !Number.isFinite(curr)) continue;
      if (prev <= 0) continue;
      const drop = Math.max(0, Math.min(1, 1 - curr / prev));
      candidates.push({ idx: i, fromUsers: prev, toUsers: curr, dropOffRate: drop });
    }

    const eligible = candidates.filter((c) => c.fromUsers >= minStarts);
    if (eligible.length === 0 && candidates.length > 0) {
      const maxFrom = Math.max(...candidates.map((c) => c.fromUsers));
      if (maxFrom > 0 && maxFrom < minStarts) {
        sampleSizeWarnings.push(
          `Low sample size: max step volume is ${maxFrom} (< ${minStarts}). Drop-off ranking may be noisy.`,
        );
      }
    }

    const toRank = eligible.length > 0 ? eligible : candidates;
    if (toRank.length === 0) {
      return { worstStep: null, dropOffRate: 0, sampleSizeWarnings };
    }

    toRank.sort((a, b) => {
      if (b.dropOffRate !== a.dropOffRate) return b.dropOffRate - a.dropOffRate;
      return b.fromUsers - a.fromUsers;
    });
    const worst = toRank[0];
    const step = steps[worst.idx];
    const prev = steps[worst.idx - 1];
    const worstStep = {
      stepKey: String(step.stepKey),
      stepLabel: String(step.stepLabel),
      dropOffRate: this.round4(worst.dropOffRate),
      fromUsers: worst.fromUsers,
      toUsers: worst.toUsers,
    };

    const first = Number(steps[0]?.uniqueUsers ?? 0);
    const last = Number(steps[steps.length - 1]?.uniqueUsers ?? 0);
    const overallDrop = first > 0 ? Math.max(0, Math.min(1, 1 - last / first)) : 0;
    return {
      worstStep,
      dropOffRate: this.round4(overallDrop),
      sampleSizeWarnings,
    };
  }

  private async aggregateUniqueActionCounts(params: {
    creatorId: string;
    contentType: string;
    contentIds: string[];
    from: Date;
    to: Date;
    includeActionTypes: TrackingActionType[];
    excludeTaskScoped?: boolean;
    excludeChapterScoped?: boolean;
  }): Promise<Record<string, { uniqueUsers: number; events: number }>> {
    const tracking = this.dbConnection.collection('trackingactions');
    const contentIds = Array.from(new Set(params.contentIds.map((id) => String(id || '').trim()).filter(Boolean)));
    if (contentIds.length === 0) return {};

    const match: any = {
      timestamp: { $gte: params.from, $lte: params.to },
      contentType: params.contentType,
      contentId: { $in: contentIds },
      actionType: { $in: params.includeActionTypes },
    };

    const chapterIdExpr = { $ifNull: ['$metadata.chapterId', ''] };
    const taskIdExpr = { $ifNull: ['$metadata.taskId', ''] };

    const scopedFilters: any[] = [];
    if (params.excludeChapterScoped) {
      scopedFilters.push({
        $or: [
          { $ne: ['$actionType', TrackingActionType.START] },
          { $eq: [chapterIdExpr, ''] },
        ],
      });
      scopedFilters.push({
        $or: [
          { $ne: ['$actionType', TrackingActionType.COMPLETE] },
          { $eq: [chapterIdExpr, ''] },
        ],
      });
    }
    if (params.excludeTaskScoped) {
      scopedFilters.push({
        $or: [
          { $ne: ['$actionType', TrackingActionType.START] },
          { $eq: [taskIdExpr, ''] },
        ],
      });
      scopedFilters.push({
        $or: [
          { $ne: ['$actionType', TrackingActionType.COMPLETE] },
          { $eq: [taskIdExpr, ''] },
        ],
      });
    }

    const pipeline: any[] = [{ $match: match }];
    if (scopedFilters.length > 0) {
      pipeline.push(
        {
          $addFields: {
            chapterIdNormalized: chapterIdExpr,
            taskIdNormalized: taskIdExpr,
          },
        },
        {
          $match: {
            $expr: scopedFilters.length === 1 ? scopedFilters[0] : { $and: scopedFilters },
          },
        },
      );
    }
    pipeline.push(
      {
        $group: {
          _id: { actionType: '$actionType', userId: '$userId' },
          events: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.actionType',
          uniqueUsers: { $sum: 1 },
          events: { $sum: '$events' },
        },
      },
      { $project: { _id: 0, actionType: '$_id', uniqueUsers: 1, events: 1 } },
    );

    const rows = await tracking.aggregate(pipeline).toArray();
    const result: Record<string, { uniqueUsers: number; events: number }> = {};
    for (const row of rows) {
      const key = String(row?.actionType || '');
      if (!key) continue;
      result[key] = {
        uniqueUsers: Number(row?.uniqueUsers || 0) || 0,
        events: Number(row?.events || 0) || 0,
      };
    }
    return result;
  }

  private async resolveContentMeta(params: {
    creatorId: string;
    contentType: string;
    contentId: string;
    communityScope: {
      hasFilter: boolean;
      lookupCommunityValues: Array<string | Types.ObjectId>;
      communityIdStrings: string[];
    };
  }): Promise<{
    title: string;
    communityId?: string;
    currency?: string;
    price?: number;
    trackingIds: string[];
    orderIds: string[];
    enrollmentCourseObjectId?: Types.ObjectId;
  }> {
    const { contentType, contentId } = params;

    const findOneByIdOrObjectId = async (collectionName: string) => {
      const col = this.dbConnection.db?.collection(collectionName);
      if (!col) return null;
      const match: any[] = [{ id: contentId }];
      if (Types.ObjectId.isValid(contentId)) match.push({ _id: new Types.ObjectId(contentId) });
      if (contentType === 'community') match.push({ slug: contentId });
      return col.findOne({ $or: match });
    };

    if (contentType === 'course') {
      const doc = await findOneByIdOrObjectId('cours');
      if (!doc) throw new NotFoundException('Course not found');
      const creatorOk = String(doc?.creatorId || '') === String(params.creatorId);
      if (!creatorOk) throw new ForbiddenException('Access denied');
      const communityId = doc?.communityId ? String(doc.communityId) : undefined;
      if (params.communityScope.hasFilter && communityId) {
        const ok = params.communityScope.communityIdStrings.includes(String(communityId));
        if (!ok) throw new ForbiddenException('Content not in requested community scope');
      }
      const trackingIds = Array.from(new Set([String(doc?.id || ''), String(doc?._id || '')].filter(Boolean)));
      const orderIds = Array.from(new Set([String(doc?._id || ''), String(doc?.id || '')].filter(Boolean)));
      return {
        title: String(doc?.titre || doc?.title || doc?.name || doc?.id || contentId),
        communityId,
        currency: String(doc?.devise || 'TND'),
        price: Number(doc?.prix || 0) || 0,
        trackingIds,
        orderIds,
        enrollmentCourseObjectId: doc?._id ? new Types.ObjectId(String(doc._id)) : undefined,
      };
    }

    if (contentType === 'challenge') {
      const doc = await findOneByIdOrObjectId('challenges');
      if (!doc) throw new NotFoundException('Challenge not found');
      const creatorOk = String(doc?.creatorId || '') === String(params.creatorId);
      if (!creatorOk) throw new ForbiddenException('Access denied');
      const communityId = doc?.communityId ? String(doc.communityId) : undefined;
      if (params.communityScope.hasFilter && communityId) {
        const ok = params.communityScope.communityIdStrings.includes(String(communityId));
        if (!ok) throw new ForbiddenException('Content not in requested community scope');
      }
      const trackingIds = Array.from(new Set([String(doc?.id || ''), String(doc?._id || '')].filter(Boolean)));
      const orderIds = Array.from(new Set([String(doc?._id || ''), String(doc?.id || '')].filter(Boolean)));
      return {
        title: String(doc?.title || doc?.name || doc?.id || contentId),
        communityId,
        currency: 'TND',
        price: Number(doc?.pricing?.participationFee || 0) || 0,
        trackingIds,
        orderIds,
      };
    }

    if (contentType === 'session') {
      const doc = await findOneByIdOrObjectId('sessions');
      if (!doc) throw new NotFoundException('Session not found');
      const creatorOk = String(doc?.creatorId || '') === String(params.creatorId);
      if (!creatorOk) throw new ForbiddenException('Access denied');
      const communityId = doc?.communityId ? String(doc.communityId) : undefined;
      if (params.communityScope.hasFilter && communityId) {
        const ok = params.communityScope.communityIdStrings.includes(String(communityId));
        if (!ok) throw new ForbiddenException('Content not in requested community scope');
      }
      const trackingIds = Array.from(new Set([String(doc?.id || ''), String(doc?._id || '')].filter(Boolean)));
      const orderIds = Array.from(new Set([String(doc?._id || ''), String(doc?.id || '')].filter(Boolean)));
      return {
        title: String(doc?.title || doc?.name || doc?.id || contentId),
        communityId,
        currency: String(doc?.currency || 'TND'),
        price: Number(doc?.price || 0) || 0,
        trackingIds,
        orderIds,
      };
    }

    if (contentType === 'event') {
      const doc = await findOneByIdOrObjectId('events');
      if (!doc) throw new NotFoundException('Event not found');
      const creatorOk = String(doc?.creatorId || '') === String(params.creatorId);
      if (!creatorOk) throw new ForbiddenException('Access denied');
      const communityId = doc?.communityId ? String(doc.communityId) : undefined;
      if (params.communityScope.hasFilter && communityId) {
        const ok = params.communityScope.communityIdStrings.includes(String(communityId));
        if (!ok) throw new ForbiddenException('Content not in requested community scope');
      }
      const trackingIds = Array.from(new Set([String(doc?.id || ''), String(doc?._id || '')].filter(Boolean)));
      const orderIds = Array.from(new Set([String(doc?._id || ''), String(doc?.id || '')].filter(Boolean)));
      return {
        title: String(doc?.title || doc?.name || doc?.id || contentId),
        communityId,
        currency: 'TND',
        price: Number(doc?.price || 0) || 0,
        trackingIds,
        orderIds,
      };
    }

    if (contentType === 'product') {
      const doc = await findOneByIdOrObjectId('products');
      if (!doc) throw new NotFoundException('Product not found');
      const creatorOk = String(doc?.creatorId || '') === String(params.creatorId);
      if (!creatorOk) throw new ForbiddenException('Access denied');
      const communityId = doc?.communityId ? String(doc.communityId) : undefined;
      if (params.communityScope.hasFilter && communityId) {
        const ok = params.communityScope.communityIdStrings.includes(String(communityId));
        if (!ok) throw new ForbiddenException('Content not in requested community scope');
      }
      const trackingIds = Array.from(new Set([String(doc?.id || ''), String(doc?._id || '')].filter(Boolean)));
      const orderIds = Array.from(new Set([String(doc?._id || ''), String(doc?.id || '')].filter(Boolean)));
      return {
        title: String(doc?.title || doc?.name || doc?.id || contentId),
        communityId,
        currency: String(doc?.currency || 'TND'),
        price: Number(doc?.price || 0) || 0,
        trackingIds,
        orderIds,
      };
    }

    if (contentType === 'post') {
      const doc = await findOneByIdOrObjectId('posts');
      if (!doc) throw new NotFoundException('Post not found');
      const authorOk = String(doc?.authorId || '') === String(params.creatorId);
      if (!authorOk) throw new ForbiddenException('Access denied');
      const communityId = doc?.communityId ? String(doc.communityId) : undefined;
      if (params.communityScope.hasFilter && communityId) {
        const ok = params.communityScope.communityIdStrings.includes(String(communityId));
        if (!ok) throw new ForbiddenException('Content not in requested community scope');
      }
      const trackingIds = Array.from(new Set([String(doc?.id || ''), String(doc?._id || '')].filter(Boolean)));
      return {
        title: String(doc?.title || doc?.id || contentId),
        communityId,
        trackingIds,
        orderIds: [],
      };
    }

    // community
    const doc = await findOneByIdOrObjectId('communities');
    if (!doc) throw new NotFoundException('Community not found');
    const creatorOk = String(doc?.createur || doc?.creatorId || '') === String(params.creatorId);
    if (!creatorOk) throw new ForbiddenException('Access denied');
    const communityId = doc?._id ? String(doc._id) : undefined;
    if (params.communityScope.hasFilter && communityId) {
      const ok = params.communityScope.lookupCommunityValues.some((value) => String(value) === String(communityId));
      if (!ok) throw new ForbiddenException('Content not in requested community scope');
    }
    const trackingIds = Array.from(
      new Set([String(doc?._id || ''), String(doc?.id || ''), String(doc?.slug || '')].filter(Boolean)),
    );
    const orderIds = Array.from(new Set([String(doc?._id || ''), String(doc?.id || '')].filter(Boolean)));
    return {
      title: String(doc?.name || doc?.slug || contentId),
      communityId,
      currency: 'TND',
      price: Number(doc?.fees_of_join || doc?.price || 0) || 0,
      trackingIds,
      orderIds,
    };
  }

  async getFunnel(
    creatorId: string,
    contentType: string,
    contentId: string,
    from: Date,
    to: Date,
    communityId?: string,
    communitySlug?: string,
  ) {
    const normalizedType = String(contentType || '').trim().toLowerCase();
    const allowed = new Set(['course', 'challenge', 'session', 'event', 'product', 'post', 'community']);
    if (!allowed.has(normalizedType)) {
      throw new NotFoundException('Unsupported content type');
    }

    const communityScope = await this.resolveCommunityScope(creatorId, communityId, communitySlug);
    const key = this.cacheKey(
      creatorId,
      from.toISOString(),
      to.toISOString(),
      `funnel:${normalizedType}:${contentId}:${communityScope.cacheKeyPart}`,
    );
    const cached = await this.getCache<any>(key);
    if (cached) return cached;

    const meta = await this.resolveContentMeta({
      creatorId,
      contentType: normalizedType,
      contentId,
      communityScope,
    });

    const warnings: string[] = [];
    const actionsToInclude =
      normalizedType === 'post'
        ? [
            TrackingActionType.VIEW,
            TrackingActionType.LIKE,
            TrackingActionType.SHARE,
            TrackingActionType.BOOKMARK,
            TrackingActionType.COMMENT,
          ]
        : normalizedType === 'product'
          ? [TrackingActionType.VIEW]
          : [TrackingActionType.VIEW, TrackingActionType.START, TrackingActionType.COMPLETE];

    const actionCounts = await this.aggregateUniqueActionCounts({
      creatorId,
      contentType: normalizedType,
      contentIds: meta.trackingIds,
      from,
      to,
      includeActionTypes: actionsToInclude,
      excludeChapterScoped: normalizedType === 'course',
      excludeTaskScoped: normalizedType === 'challenge',
    });

    const step = (actionType: TrackingActionType, label: string) => ({
      stepKey: actionType,
      stepLabel: label,
      uniqueUsers: Number(actionCounts?.[actionType]?.uniqueUsers || 0) || 0,
      events: Number(actionCounts?.[actionType]?.events || 0) || 0,
      rateFromPrev: null as number | null,
    });

    const steps: Array<any> = [];
    if (normalizedType === 'post') {
      steps.push(step(TrackingActionType.VIEW, 'Views'));
      steps.push(step(TrackingActionType.LIKE, 'Likes'));
      steps.push(step(TrackingActionType.SHARE, 'Shares'));
      steps.push(step(TrackingActionType.BOOKMARK, 'Bookmarks'));
      steps.push(step(TrackingActionType.COMMENT, 'Comments'));
    } else if (normalizedType === 'product') {
      steps.push(step(TrackingActionType.VIEW, 'Views'));
    } else {
      steps.push(step(TrackingActionType.VIEW, 'Views'));
      steps.push(step(TrackingActionType.START, 'Starts'));
      steps.push(step(TrackingActionType.COMPLETE, 'Completes'));
    }

    // Compute revenue/purchases when applicable (orders use mongo _id string in many flows; resolveContentMeta provides both).
    let revenueTotal = 0;
    let purchaseCount = 0;
    let uniqueBuyers = 0;
    if (normalizedType !== 'post') {
      const ordersCollection = this.dbConnection.db?.collection('orders');
      if (ordersCollection) {
        const orderMatch: any = {
          creatorId: this.getCreatorObjectId(creatorId),
          status: 'paid',
          contentType: normalizedType,
          contentId: { $in: meta.orderIds },
          createdAt: { $gte: from, $lte: to },
        };

        // Prefer explicit order communityId when filtering.
        if (communityScope.hasFilter) {
          orderMatch.communityId = { $in: communityScope.lookupCommunityValues };
        }

        const rows = await ordersCollection
          .aggregate([
            { $match: orderMatch },
            {
              $group: {
                _id: null,
                revenue: { $sum: '$creatorNetDT' },
                count: { $sum: 1 },
                buyers: { $addToSet: '$buyerId' },
              },
            },
            { $project: { _id: 0, revenue: 1, count: 1, uniqueBuyers: { $size: '$buyers' } } },
          ])
          .toArray();
        revenueTotal = Number(rows?.[0]?.revenue || 0) || 0;
        purchaseCount = Number(rows?.[0]?.count || 0) || 0;
        uniqueBuyers = Number(rows?.[0]?.uniqueBuyers || 0) || 0;
      } else {
        warnings.push('Orders collection is unavailable; revenue metrics omitted.');
      }
    }

    // Course enrollments (true conversion) for course funnel.
    let enrollments = 0;
    let enrollmentUsers = 0;
    if (normalizedType === 'course' && meta.enrollmentCourseObjectId) {
      const enrollmentsCollection = this.dbConnection.db?.collection('courseenrollments');
      if (enrollmentsCollection) {
        const allEnrollments =
          (await enrollmentsCollection
            .find({ courseId: new Types.ObjectId(String(meta.enrollmentCourseObjectId)) })
            .project({ userId: 1, enrolledAt: 1, createdAt: 1 })
            .toArray()) || [];

        const inRange = (value: any): boolean => {
          const date = value instanceof Date ? value : new Date(value);
          return !Number.isNaN(date.getTime()) && date >= from && date <= to;
        };

        const getEnrollmentDate = (enrollment: any): Date | null => {
          const candidate = enrollment?.enrolledAt || enrollment?.createdAt;
          if (!candidate) return null;
          const parsed = candidate instanceof Date ? candidate : new Date(candidate);
          return Number.isNaN(parsed.getTime()) ? null : parsed;
        };

        const periodEnrollments = allEnrollments.filter((entry: any) => {
          const dt = getEnrollmentDate(entry);
          return dt ? inRange(dt) : false;
        });

        enrollments = periodEnrollments.length;
        const distinctUsers = new Set(periodEnrollments.map((e: any) => String(e?.userId || '')).filter(Boolean));
        enrollmentUsers = distinctUsers.size;
      }
    }

    // Add purchases/revenue steps for commerce items.
    if (normalizedType !== 'post') {
      steps.push({
        stepKey: 'purchases',
        stepLabel: 'Purchases',
        uniqueUsers: uniqueBuyers,
        events: purchaseCount,
        rateFromPrev: null,
      });
      if (normalizedType === 'course') {
        steps.push({
          stepKey: 'enrollments',
          stepLabel: 'Enrollments',
          uniqueUsers: enrollmentUsers,
          events: enrollments,
          rateFromPrev: null,
        });
      }
      steps.push({
        stepKey: 'revenue',
        stepLabel: 'Revenue',
        uniqueUsers: null,
        events: Number(revenueTotal || 0),
        rateFromPrev: null,
      });
    }

    // compute step conversion rates
    for (let i = 1; i < steps.length; i++) {
      const prev = Number(steps[i - 1]?.uniqueUsers ?? 0);
      const curr = Number(steps[i]?.uniqueUsers ?? 0);
      if (!Number.isFinite(prev) || prev <= 0) {
        steps[i].rateFromPrev = null;
      } else {
        steps[i].rateFromPrev = this.round4(curr / prev);
      }
    }

    const minStarts = this.getFunnelMinStarts();
    const dropOff = this.buildDropOffSummary({ steps, minStarts });
    const payload = {
      contentMeta: {
        title: meta.title,
        communityId: meta.communityId,
        currency: meta.currency,
        price: meta.price,
        trackingIds: meta.trackingIds,
        orderIds: meta.orderIds,
      },
      funnel: steps,
      dropOff,
      warnings: [...warnings, ...dropOff.sampleSizeWarnings],
    };

    this.setCache(key, payload, 5 * 60 * 1000);
    return payload;
  }

  async getCourseChaptersFunnel(
    creatorId: string,
    courseId: string,
    from: Date,
    to: Date,
    communityId?: string,
    communitySlug?: string,
  ) {
    const communityScope = await this.resolveCommunityScope(creatorId, communityId, communitySlug);
    const key = this.cacheKey(
      creatorId,
      from.toISOString(),
      to.toISOString(),
      `course-chapters-funnel:${courseId}:${communityScope.cacheKeyPart}`,
    );
    const cached = await this.getCache<any>(key);
    if (cached) return cached;

    const coursesCollection = this.dbConnection.db?.collection('cours');
    if (!coursesCollection) {
      throw new NotFoundException('Courses collection is unavailable');
    }

    const match: any[] = [{ id: courseId }];
    if (Types.ObjectId.isValid(courseId)) match.push({ _id: new Types.ObjectId(courseId) });
    const course = await coursesCollection.findOne({ $or: match, creatorId: this.getCreatorObjectId(creatorId) });
    if (!course) throw new NotFoundException('Course not found');

    const courseCommunityId = course?.communityId ? String(course.communityId) : undefined;
    if (communityScope.hasFilter && courseCommunityId) {
      const ok = communityScope.communityIdStrings.includes(courseCommunityId);
      if (!ok) throw new ForbiddenException('Content not in requested community scope');
    }

    const trackingIds = Array.from(new Set([String(course?.id || ''), String(course?._id || '')].filter(Boolean)));
    const canonicalCourseId = String(course?.id || courseId);

    const sections = Array.isArray(course.sections) ? course.sections : [];
    const orderedChapters: Array<{
      stepId: string;
      stepTitle: string;
      sectionId: string;
      order: number;
      isPreview: boolean;
      isPaidChapter: boolean;
    }> = [];

    for (const section of sections) {
      const sectionId = String(section?.id || '');
      const chapitres = Array.isArray(section?.chapitres) ? section.chapitres : [];
      for (const chapitre of chapitres) {
        orderedChapters.push({
          stepId: String(chapitre?.id || ''),
          stepTitle: String(chapitre?.titre || chapitre?.title || 'Chapter'),
          sectionId,
          order: Number(chapitre?.ordre ?? 0) || 0,
          isPreview: Boolean(chapitre?.isPreview),
          isPaidChapter: Boolean(chapitre?.isPaidChapter),
        });
      }
    }

    // Stable ordering: section order is not guaranteed, but chapter ordre is within section.
    orderedChapters.sort((a, b) => a.order - b.order);

    const tracking = this.dbConnection.collection('trackingactions');
    const chapterIdExpr = { $ifNull: ['$metadata.chapterId', ''] };
    const isChapterStartActionExpr = {
      $or: [
        { $eq: ['$actionType', TrackingActionType.CHAPTER_START] },
        {
          $and: [
            { $eq: ['$actionType', TrackingActionType.START] },
            { $ne: [chapterIdExpr, ''] },
          ],
        },
      ],
    };
    const isChapterCompleteActionExpr = {
      $or: [
        { $eq: ['$actionType', TrackingActionType.CHAPTER_COMPLETE] },
        {
          $and: [
            { $eq: ['$actionType', TrackingActionType.COMPLETE] },
            { $ne: [chapterIdExpr, ''] },
          ],
        },
      ],
    };

    const pipeline: any[] = [
      { $match: { timestamp: { $gte: from, $lte: to }, contentType: 'course', contentId: { $in: trackingIds } } },
      {
        $project: {
          userId: 1,
          chapterId: '$metadata.chapterId',
          chapterIdNormalized: chapterIdExpr,
          isStart: { $cond: [isChapterStartActionExpr, 1, 0] },
          isComplete: { $cond: [isChapterCompleteActionExpr, 1, 0] },
        },
      },
      { $match: { chapterIdNormalized: { $ne: '' } } },
      {
        $group: {
          _id: { chapterId: '$chapterIdNormalized', userId: '$userId' },
          didStart: { $max: '$isStart' },
          didComplete: { $max: '$isComplete' },
        },
      },
      {
        $group: {
          _id: '$_id.chapterId',
          uniqueStarts: { $sum: '$didStart' },
          uniqueCompletes: { $sum: '$didComplete' },
        },
      },
      { $project: { _id: 0, chapterId: '$_id', uniqueStarts: 1, uniqueCompletes: 1 } },
    ];

    const rows = await tracking.aggregate(pipeline).toArray();
    const byChapter = new Map(rows.map((r: any) => [String(r.chapterId), r]));

    const items = orderedChapters.map((chapter) => {
      const row = byChapter.get(String(chapter.stepId)) || { uniqueStarts: 0, uniqueCompletes: 0 };
      const uniqueStarts = Number(row.uniqueStarts || 0) || 0;
      const uniqueCompletes = Number(row.uniqueCompletes || 0) || 0;
      const completionRate = uniqueStarts > 0 ? uniqueCompletes / uniqueStarts : 0;
      const dropOffRate = uniqueStarts > 0 ? 1 - completionRate : 0;
      return {
        ...chapter,
        uniqueStarts,
        uniqueCompletes,
        completionRate: this.round4(completionRate),
        dropOffRate: this.round4(dropOffRate),
      };
    });

    const minStarts = this.getFunnelMinStarts();
    const ranked = items
      .filter((it) => it.uniqueStarts >= minStarts)
      .sort((a, b) => {
        if (b.dropOffRate !== a.dropOffRate) return b.dropOffRate - a.dropOffRate;
        return b.uniqueStarts - a.uniqueStarts;
      });
    const maxStarts = Math.max(0, ...items.map((it) => it.uniqueStarts));
    const warnings: string[] = [];
    if (ranked.length === 0 && maxStarts > 0 && maxStarts < minStarts) {
      warnings.push(`Low sample size: max chapter starts is ${maxStarts} (< ${minStarts}).`);
    }

    const payload = {
      contentMeta: {
        courseId: canonicalCourseId,
        courseTitle: String(course?.titre || ''),
        communityId: courseCommunityId,
        totalChapters: items.length,
      },
      items,
      dropOff: {
        worstStep: ranked.length > 0
          ? {
              stepId: ranked[0].stepId,
              stepTitle: ranked[0].stepTitle,
              dropOffRate: ranked[0].dropOffRate,
              uniqueStarts: ranked[0].uniqueStarts,
              uniqueCompletes: ranked[0].uniqueCompletes,
            }
          : null,
      },
      warnings,
    };

    this.setCache(key, payload, 10 * 60 * 1000);
    return payload;
  }

  async getChallengeTasksFunnel(
    creatorId: string,
    challengeId: string,
    from: Date,
    to: Date,
    communityId?: string,
    communitySlug?: string,
  ) {
    const communityScope = await this.resolveCommunityScope(creatorId, communityId, communitySlug);
    const key = this.cacheKey(
      creatorId,
      from.toISOString(),
      to.toISOString(),
      `challenge-tasks-funnel:${challengeId}:${communityScope.cacheKeyPart}`,
    );
    const cached = await this.getCache<any>(key);
    if (cached) return cached;

    const challengesCollection = this.dbConnection.db?.collection('challenges');
    if (!challengesCollection) throw new NotFoundException('Challenges collection is unavailable');

    const match: any[] = [{ id: challengeId }];
    if (Types.ObjectId.isValid(challengeId)) match.push({ _id: new Types.ObjectId(challengeId) });
    const challenge = await challengesCollection.findOne({ $or: match, creatorId: this.getCreatorObjectId(creatorId) });
    if (!challenge) throw new NotFoundException('Challenge not found');

    const challengeCommunityId = challenge?.communityId ? String(challenge.communityId) : undefined;
    if (communityScope.hasFilter && challengeCommunityId) {
      const ok = communityScope.communityIdStrings.includes(challengeCommunityId);
      if (!ok) throw new ForbiddenException('Content not in requested community scope');
    }

    const trackingIds = Array.from(new Set([String(challenge?.id || ''), String(challenge?._id || '')].filter(Boolean)));
    const canonicalChallengeId = String(challenge?.id || challengeId);
    const tasks = Array.isArray(challenge.tasks) ? challenge.tasks : [];
    const orderedTasks = tasks
      .map((task: any) => ({
        stepId: String(task?.id || task?._id || task?.day || ''),
        stepTitle: String(task?.title || `Task ${task?.day || ''}` || 'Task'),
        day: Number(task?.day || 0) || 0,
      }))
      .filter((task: any) => task.stepId);
    orderedTasks.sort((a, b) => a.day - b.day);

    const tracking = this.dbConnection.collection('trackingactions');
    const taskIdExpr = { $ifNull: ['$metadata.taskId', ''] };
    const pipeline: any[] = [
      { $match: { timestamp: { $gte: from, $lte: to }, contentType: 'challenge', contentId: { $in: trackingIds } } },
      { $project: { userId: 1, actionType: 1, taskId: '$metadata.taskId', taskIdNormalized: taskIdExpr } },
      { $match: { taskIdNormalized: { $ne: '' } } },
      {
        $group: {
          _id: { taskId: '$taskIdNormalized', userId: '$userId' },
          didStart: { $max: { $cond: [{ $eq: ['$actionType', TrackingActionType.START] }, 1, 0] } },
          didComplete: { $max: { $cond: [{ $eq: ['$actionType', TrackingActionType.COMPLETE] }, 1, 0] } },
        },
      },
      {
        $group: {
          _id: '$_id.taskId',
          uniqueStarts: { $sum: '$didStart' },
          uniqueCompletes: { $sum: '$didComplete' },
        },
      },
      { $project: { _id: 0, taskId: '$_id', uniqueStarts: 1, uniqueCompletes: 1 } },
    ];

    const rows = await tracking.aggregate(pipeline).toArray();
    const byTask = new Map(rows.map((r: any) => [String(r.taskId), r]));

    const items = orderedTasks.map((task) => {
      const row = byTask.get(String(task.stepId)) || { uniqueStarts: 0, uniqueCompletes: 0 };
      const uniqueStarts = Number(row.uniqueStarts || 0) || 0;
      const uniqueCompletes = Number(row.uniqueCompletes || 0) || 0;
      const completionRate = uniqueStarts > 0 ? uniqueCompletes / uniqueStarts : 0;
      const dropOffRate = uniqueStarts > 0 ? 1 - completionRate : 0;
      return {
        ...task,
        uniqueStarts,
        uniqueCompletes,
        completionRate: this.round4(completionRate),
        dropOffRate: this.round4(dropOffRate),
      };
    });

    const minStarts = this.getFunnelMinStarts();
    const ranked = items
      .filter((it) => it.uniqueStarts >= minStarts)
      .sort((a, b) => {
        if (b.dropOffRate !== a.dropOffRate) return b.dropOffRate - a.dropOffRate;
        return b.uniqueStarts - a.uniqueStarts;
      });
    const maxStarts = Math.max(0, ...items.map((it) => it.uniqueStarts));
    const warnings: string[] = [];
    if (ranked.length === 0 && maxStarts > 0 && maxStarts < minStarts) {
      warnings.push(`Low sample size: max task starts is ${maxStarts} (< ${minStarts}).`);
    }

    const payload = {
      contentMeta: {
        challengeId: canonicalChallengeId,
        challengeTitle: String(challenge?.title || ''),
        communityId: challengeCommunityId,
        totalTasks: items.length,
      },
      items,
      dropOff: {
        worstStep: ranked.length > 0
          ? {
              stepId: ranked[0].stepId,
              stepTitle: ranked[0].stepTitle,
              dropOffRate: ranked[0].dropOffRate,
              uniqueStarts: ranked[0].uniqueStarts,
              uniqueCompletes: ranked[0].uniqueCompletes,
            }
          : null,
      },
      warnings,
    };

    this.setCache(key, payload, 10 * 60 * 1000);
    return payload;
  }

  async getCourseAnalytics(creatorId: string, courseId: string, from: Date, to: Date) {
    const key = this.cacheKey(creatorId, `${courseId}:${from.toISOString()}`, to.toISOString(), 'course');
    const cached = await this.getCache<any>(key);
    if (cached) return cached;

    const creatorObjectId = this.getCreatorObjectId(creatorId);
    const coursesCollection = this.dbConnection.db?.collection('cours');
    const enrollmentsCollection = this.dbConnection.db?.collection('courseenrollments');
    const tracking = this.dbConnection.collection('trackingactions');

    // Resolve by either custom id or Mongo _id string
    const courseMatch: any[] = [{ id: courseId }];
    if (Types.ObjectId.isValid(courseId)) {
      courseMatch.push({ _id: new Types.ObjectId(courseId) });
    }

    const course = await coursesCollection?.findOne({ $or: courseMatch, creatorId: creatorObjectId });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Canonical course content id for tracking/rollups is custom `id`.
    const canonicalCourseId = String(course.id || courseId);

    // Fetch enrollments, then filter by period in-memory to support inconsistent date field usage.
    const allEnrollments = await enrollmentsCollection?.find({
      courseId: new Types.ObjectId(course._id),
    }).toArray() || [];

    const inRange = (value: any): boolean => {
      const date = value instanceof Date ? value : new Date(value);
      return !Number.isNaN(date.getTime()) && date >= from && date <= to;
    };

    const getEnrollmentDate = (enrollment: any): Date | null => {
      const candidate = enrollment?.enrolledAt || enrollment?.createdAt;
      if (!candidate) return null;
      const parsed = candidate instanceof Date ? candidate : new Date(candidate);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const periodEnrollments = allEnrollments.filter((enrollment: any) => {
      const enrollmentDate = getEnrollmentDate(enrollment);
      return enrollmentDate ? inRange(enrollmentDate) : false;
    });

    const pricePerEnrollment = Number(course?.prix || 0);
    const enrollmentsCount = periodEnrollments.length;
    const revenue = enrollmentsCount * pricePerEnrollment;

    const completionCount = periodEnrollments.filter((enrollment: any) => {
      const completedAt = enrollment?.completedAt;
      if (completedAt) return inRange(completedAt);
      // Fallback: treat as completed if all progression entries are complete
      const progression = Array.isArray(enrollment?.progression) ? enrollment.progression : [];
      if (progression.length === 0) return false;
      return progression.every((entry: any) => Boolean(entry?.isCompleted));
    }).length;

    let totalProgressItems = 0;
    let completedProgressItems = 0;
    for (const enrollment of periodEnrollments) {
      const progression = Array.isArray(enrollment?.progression) ? enrollment.progression : [];
      totalProgressItems += progression.length;
      completedProgressItems += progression.filter((entry: any) => Boolean(entry?.isCompleted)).length;
    }

    const completionRate = totalProgressItems > 0
      ? (completedProgressItems / totalProgressItems) * 100
      : 0;

    const courseTracking = await tracking.aggregate([
      {
        $match: {
          timestamp: { $gte: from, $lte: to },
          contentType: 'course',
          contentId: canonicalCourseId,
        },
      },
      {
        $group: {
          _id: null,
          views: { $sum: { $cond: [{ $eq: ['$actionType', TrackingActionType.VIEW] }, 1, 0] } },
          starts: { $sum: { $cond: [{ $eq: ['$actionType', TrackingActionType.START] }, 1, 0] } },
        },
      },
    ]).toArray();

    const dailyTrendFromMongo = await this.dailyModel.aggregate([
      {
        $match: {
          creatorId: creatorObjectId,
          contentType: 'course',
          contentId: canonicalCourseId,
          date: { $gte: from, $lte: to },
        },
      },
      {
        $project: {
          _id: 0,
          date: 1,
          views: 1,
          starts: 1,
          completes: 1,
          watchTimeSeconds: '$watchTime',
        },
      },
      { $sort: { date: 1 } },
    ]);

    let trendForCourse = dailyTrendFromMongo;
    try {
      if (process.env.USE_GA4_COURSE_TREND === 'true') {
        const ga4Trend = await this.ga4ReportingService.getContentTimeSeries(
          canonicalCourseId,
          'course',
          from.toISOString().slice(0, 10),
          to.toISOString().slice(0, 10),
        );
        if (ga4Trend.length > 0) {
          trendForCourse = ga4Trend.map((row) => ({
            date: row.date,
            views: Number(row.views || 0),
            starts: Number(row.starts || 0),
            completes: Number(row.completes || 0),
            watchTimeSeconds: 0,
          }));
        }
      }
    } catch {
      // Fail silently and keep Mongo-based trend
    }

    const views = Number(courseTracking?.[0]?.views || 0);
    const starts = Number(courseTracking?.[0]?.starts || 0);
    const totalWatchTimeSeconds = trendForCourse.reduce(
      (sum, day: any) => sum + Number(day?.watchTimeSeconds || 0),
      0,
    );
    const avgWatchTimeSeconds = starts > 0 ? totalWatchTimeSeconds / starts : 0;

    const round2 = (value: number): number => Math.round(value * 100) / 100;
    const viewsToEnrollmentRate = views > 0 ? (enrollmentsCount / views) * 100 : 0;
    const dropOffRate = totalProgressItems > 0 ? 100 - completionRate : 0;
    const engagementScore = views > 0 ? (starts / views) * 100 : 0;

    if (process.env.DEBUG_ANALYTICS_COURSE === 'true') {
      this.logger.debug(
        `[CourseAnalytics] course=${canonicalCourseId} range=${from.toISOString()}..${to.toISOString()} enrollments=${enrollmentsCount} views=${views} starts=${starts} progress=${completedProgressItems}/${totalProgressItems}`,
      );
    }

    const analytics = {
      courseId: canonicalCourseId,
      courseTitle: String(course.titre || ''),
      range: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      kpis: {
        enrollments: enrollmentsCount,
        revenue: round2(revenue),
        views,
        starts,
        completes: completionCount,
        completionRate: round2(completionRate),
        avgWatchTimeSeconds: round2(avgWatchTimeSeconds),
        totalWatchTimeSeconds: round2(totalWatchTimeSeconds),
      },
      rates: {
        viewsToEnrollmentRate: round2(viewsToEnrollmentRate),
        dropOffRate: round2(dropOffRate),
        engagementScore: round2(engagementScore),
      },
      dailyTrend: trendForCourse.map((day: any) => ({
        date: day?.date,
        views: Number(day?.views || 0),
        starts: Number(day?.starts || 0),
        completes: Number(day?.completes || 0),
        watchTimeSeconds: Number(day?.watchTimeSeconds || 0),
      })),
      meta: {
        completionSource: 'progression',
        timezone: 'UTC',
        currency: String(course.devise || 'TND'),
      },
    };

    this.setCache(key, analytics);
    return analytics;
  }

  async getContentCharts(
    creatorId: string,
    from: Date,
    to: Date,
    communityId?: string,
    communitySlug?: string,
    contentType?: string,
    contentId?: string,
  ) {
    const { from: clampedFrom, to: clampedTo, lookbackDays } = await this.clampDateRangeForPlan(creatorId, from, to);
    const communityScope = await this.resolveCommunityScope(creatorId, communityId, communitySlug);
    const normalizedType = contentType ? this.normalizeChartContentType(contentType) : null;

    if (contentType && !normalizedType) {
      throw new NotFoundException('Unsupported analytics content type');
    }

    if (contentId && !normalizedType) {
      throw new NotFoundException('contentType is required when filtering by contentId');
    }

    const cacheScope = normalizedType || 'all';
    const key = this.cacheKey(
      creatorId,
      clampedFrom.toISOString(),
      clampedTo.toISOString(),
      `content-charts:v2:${cacheScope}:${contentId || 'all'}:${communityScope.cacheKeyPart}`,
    );
    const cached = await this.getCache<any>(key);
    if (cached) return cached;

    const types = normalizedType ? [normalizedType] : this.getChartContentTypes();
    const packs = await Promise.all(
      types.map((type) =>
        this.buildContentTypeChartPack(
          creatorId,
          type,
          clampedFrom,
          clampedTo,
          communityScope,
          normalizedType ? contentId : undefined,
        ),
      ),
    );

    const result = normalizedType
      ? packs[0]
      : {
          generatedAt: new Date().toISOString(),
          range: {
            from: clampedFrom.toISOString(),
            to: clampedTo.toISOString(),
            timezone: 'UTC',
            lookbackDays,
          },
          community: {
            scoped: communityScope.hasFilter,
            id: communityScope.hasFilter ? communityScope.cacheKeyPart : null,
          },
          byContentType: packs.reduce<Record<string, any>>((acc, pack) => {
            acc[pack.contentType] = pack;
            return acc;
          }, {}),
        };

    this.setCache(key, result, 2 * 60 * 1000);
    return result;
  }

  async getDashboardAnalytics(
    creatorId: string,
    from: Date,
    to: Date,
    plan?: PlanTier,
    communityId?: string,
    communitySlug?: string,
    contentType?: string,
  ) {
    const normalizedType = contentType ? this.normalizeChartContentType(contentType) : null;
    const cacheScope = normalizedType || 'all';
    const key = this.cacheKey(
      creatorId,
      from.toISOString(),
      to.toISOString(),
      `dashboard-v2:${cacheScope}:${communityId || communitySlug || 'all'}`,
    );
    const cached = await this.getCache<any>(key);
    if (cached) return cached;

    const durationMs = Math.max(24 * 3600 * 1000, to.getTime() - from.getTime());
    const compareTo = new Date(from.getTime() - 1);
    const compareFrom = new Date(compareTo.getTime() - durationMs);

    const [overview, contentCharts, revenue, referrers, devices, revenueCompare, usersCompare, startsCompare, engagementCompare, viewsCompare] =
      await Promise.all([
        this.getOverview(creatorId, from, to, plan, communityId, communitySlug),
        this.getContentCharts(creatorId, from, to, communityId, communitySlug, normalizedType || undefined),
        this.getRevenue(creatorId, from, to, communityId, communitySlug, normalizedType || undefined),
        this.getReferrers(creatorId, from, to, communityId, communitySlug),
        this.getDevices(creatorId, from, to, communityId, communitySlug),
        this.getCompare(creatorId, from, to, compareFrom, compareTo, 'revenueAttributed', communityId, communitySlug).catch(() => null),
        this.getCompare(creatorId, from, to, compareFrom, compareTo, 'uniqueUsers', communityId, communitySlug).catch(() => null),
        this.getCompare(creatorId, from, to, compareFrom, compareTo, 'starts', communityId, communitySlug).catch(() => null),
        this.getCompare(creatorId, from, to, compareFrom, compareTo, 'completes', communityId, communitySlug).catch(() => null),
        this.getCompare(creatorId, from, to, compareFrom, compareTo, 'views', communityId, communitySlug).catch(() => null),
      ]);

    const packs = this.extractDashboardPacks(contentCharts, normalizedType || undefined);
    const series = this.buildDashboardSeries(packs, revenue?.trend || []);
    const isFilteredContentView = Boolean(normalizedType);
    const totals = this.buildDashboardTotals(packs, overview, revenue, isFilteredContentView);
    const currency = String(revenue?.currency || 'TND');
    const revenueByType = this.buildDashboardRevenueByType(packs, revenue);
    const memberSources = this.buildDashboardMemberSources(referrers?.rows || []);
    const contentPerformance = this.buildDashboardContentPerformance(packs);
    const avgDuration = isFilteredContentView ? totals.avgDuration : Number(overview?.averageDuration ?? overview?.avgDuration ?? totals.avgDuration ?? 0) || 0;
    const engagementRate = isFilteredContentView ? totals.engagementRate : Number(overview?.engagementRate ?? overview?.avgEngagement ?? totals.engagementRate ?? 0) || 0;
    const completionRate = isFilteredContentView ? totals.completionRate : Number(overview?.completionRate ?? totals.completionRate ?? 0) || 0;
    const isPostView = normalizedType === 'post';
    const kpis = isPostView
      ? [
          {
            id: 'views',
            label: 'Post Views',
            value: totals.views,
            formattedValue: totals.views.toLocaleString(),
            change: this.round2(Number(viewsCompare?.change || 0)),
            sub: 'views across posts',
            color: 'var(--p)',
            iconKey: 'views',
          },
          {
            id: 'members',
            label: 'Active Readers',
            value: totals.members,
            formattedValue: totals.members.toLocaleString(),
            change: this.round2(Number(usersCompare?.change || 0)),
            sub: 'unique tracked readers',
            color: 'var(--cyan)',
            iconKey: 'members',
          },
          {
            id: 'interactions',
            label: 'Interactions',
            value: totals.interactions,
            formattedValue: totals.interactions.toLocaleString(),
            change: this.round2(Number(startsCompare?.change || 0)),
            sub: 'likes, comments, shares, bookmarks',
            color: 'var(--orange)',
            iconKey: 'interactions',
          },
          {
            id: 'engagement',
            label: 'Post Engagement',
            value: this.round2(engagementRate),
            formattedValue: `${this.round2(engagementRate)}%`,
            change: this.round2(Number(engagementCompare?.change || 0)),
            sub: 'interactions per view',
            color: 'var(--pink)',
            iconKey: 'engagement',
          },
        ]
      : [
          {
            id: 'revenue',
            label: 'Total Revenue',
            value: this.round2(totals.revenue),
            formattedValue: `${this.round2(totals.revenue).toLocaleString()} ${currency}`,
            change: this.round2(Number(revenueCompare?.change || 0)),
            sub: 'vs previous period',
            color: 'var(--p)',
            iconKey: 'revenue',
          },
          {
            id: 'members',
            label: 'Active Members',
            value: totals.members,
            formattedValue: totals.members.toLocaleString(),
            change: this.round2(Number(usersCompare?.change || 0)),
            sub: 'unique tracked users',
            color: 'var(--cyan)',
            iconKey: 'members',
          },
          {
            id: 'enrollments',
            label: 'Enrollments',
            value: totals.enrollments,
            formattedValue: totals.enrollments.toLocaleString(),
            change: this.round2(Number(startsCompare?.change || 0)),
            sub: 'starts, bookings and registrations',
            color: 'var(--orange)',
            iconKey: 'enrollments',
          },
          {
            id: 'engagement',
            label: 'Engagement Rate',
            value: this.round2(engagementRate),
            formattedValue: `${this.round2(engagementRate)}%`,
            change: this.round2(Number(engagementCompare?.change || 0)),
            sub: 'avg across community',
            color: 'var(--pink)',
            iconKey: 'engagement',
          },
        ];

    const result = {
      generatedAt: new Date().toISOString(),
      range: {
        from: from.toISOString(),
        to: to.toISOString(),
        timezone: 'UTC',
      },
      filters: {
        communityId: communityId || null,
        communitySlug: communitySlug || null,
        contentType: normalizedType || 'all',
      },
      currency,
      kpis,
      timeSeries: {
        labels: series.map((point) => point.date),
        revenue: series.map((point) => point.revenue),
        members: series.map((point) => point.members),
        enrollments: series.map((point) => point.enrollments),
        interactions: series.map((point) => point.interactions),
        views: series.map((point) => point.views),
        completions: series.map((point) => point.completions),
      },
      revenueByType,
      memberSources,
      communityHealth: [
        {
          id: 'active-members',
          label: 'Active Members',
          value: totals.members.toLocaleString(),
          rawValue: totals.members,
          sub: 'unique tracked users',
          color: '#16a34a',
          iconKey: 'users',
        },
        isPostView
          ? {
              id: 'post-interactions',
              label: 'Interactions',
              value: totals.interactions.toLocaleString(),
              rawValue: totals.interactions,
              sub: 'social actions on posts',
              color: 'var(--p)',
              iconKey: 'interactions',
            }
          : {
              id: 'avg-session-time',
              label: 'Avg. Session Time',
              value: `${avgDuration} min`,
              rawValue: avgDuration,
              sub: 'per content start',
              color: 'var(--p)',
              iconKey: 'duration',
            },
        {
          id: 'completion-rate',
          label: 'Completion Rate',
          value: `${this.round2(completionRate)}%`,
          rawValue: this.round2(completionRate),
          sub: 'starts to completions',
          color: 'var(--orange)',
          iconKey: 'completion',
        },
        {
          id: 'traffic-sources',
          label: 'Traffic Sources',
          value: String(memberSources.length),
          rawValue: memberSources.length,
          sub: 'tracked source channels',
          color: 'var(--pink)',
          iconKey: 'sources',
        },
      ],
      contentPerformance,
      devices: {
        rows: devices?.rows || [],
        details: devices?.details || [],
      },
      meta: {
        precisionLabel: this.resolveDashboardPrecisionLabel(packs),
        sources: Array.from(new Set(packs.flatMap((pack: any) => pack?.precision?.sources || []))),
        notes: Array.from(new Set(packs.flatMap((pack: any) => pack?.precision?.notes || []))),
      },
    };

    this.setCache(key, result, 2 * 60 * 1000);
    return result;
  }

  private extractDashboardPacks(contentCharts: any, contentType?: AnalyticsChartContentType): any[] {
    if (!contentCharts) return [];
    if (contentType) return [contentCharts].filter(Boolean);
    const byContentType = contentCharts?.byContentType || {};
    return this.getChartContentTypes()
      .map((type) => byContentType[type])
      .filter(Boolean);
  }

  private getDashboardChart(pack: any, chartId: string): any | null {
    return (pack?.charts || []).find((chart: any) => chart?.id === chartId) || null;
  }

  private titleCase(value: string): string {
    return String(value || '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private getDashboardTypeColor(type: string): string {
    const colors: Record<string, string> = {
      course: 'var(--p)',
      challenge: 'var(--orange)',
      session: 'var(--cyan)',
      event: 'var(--pink)',
      product: '#16a34a',
      post: '#64748b',
    };
    return colors[type] || 'var(--p)';
  }

  private buildDashboardSeries(packs: any[], revenueTrend: any[]): AnalyticsDashboardSeriesPoint[] {
    const byDate = new Map<string, AnalyticsDashboardSeriesPoint>();
    const ensure = (date: string) => {
      if (!byDate.has(date)) {
        byDate.set(date, { date, revenue: 0, members: 0, enrollments: 0, interactions: 0, views: 0, completions: 0 });
      }
      return byDate.get(date)!;
    };

    for (const pack of packs) {
      const daily = this.getDashboardChart(pack, 'daily-performance')?.data || [];
      for (const row of daily) {
        const date = String(row?.date || '');
        if (!date) continue;
        const target = ensure(date);
        target.members += this.toFiniteNumber(row?.uniqueUsers);
        target.enrollments += this.toFiniteNumber(row?.starts);
        target.interactions += this.getDashboardInteractionCount(row);
        target.views += this.toFiniteNumber(row?.views);
        target.completions += this.toFiniteNumber(row?.completes);
      }

      const packRevenue = this.getDashboardChart(pack, 'revenue-trend')?.data || [];
      for (const row of packRevenue) {
        const date = String(row?.date || '');
        if (!date) continue;
        ensure(date).revenue += this.toFiniteNumber(row?.revenue);
      }
    }

    if ([...byDate.values()].every((point) => point.revenue === 0)) {
      for (const row of revenueTrend || []) {
        const date = String(row?.date || '');
        if (!date) continue;
        ensure(date).revenue += this.toFiniteNumber(row?.revenue);
      }
    }

    return Array.from(byDate.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((point) => ({
        ...point,
        revenue: this.round2(point.revenue),
        members: Math.round(point.members),
        enrollments: Math.round(point.enrollments),
        interactions: Math.round(point.interactions),
        views: Math.round(point.views),
        completions: Math.round(point.completions),
      }));
  }

  private getDashboardInteractionCount(totals: any): number {
    return this.toFiniteNumber(totals?.likes) +
      this.toFiniteNumber(totals?.shares) +
      this.toFiniteNumber(totals?.downloads) +
      this.toFiniteNumber(totals?.bookmarks) +
      this.toFiniteNumber(totals?.comments) +
      this.toFiniteNumber(totals?.ratingsCount);
  }

  private buildDashboardTotals(packs: any[], overview: any, revenue: any, isFilteredContentView = false) {
    const starts = packs.reduce((sum, pack) => sum + this.toFiniteNumber(pack?.totals?.starts), 0);
    const completes = packs.reduce((sum, pack) => sum + this.toFiniteNumber(pack?.totals?.completes), 0);
    const views = packs.reduce((sum, pack) => sum + this.toFiniteNumber(pack?.totals?.views), 0);
    const watchTime = packs.reduce((sum, pack) => sum + this.toFiniteNumber(pack?.totals?.watchTime), 0);
    const packRevenue = packs.reduce((sum, pack) => sum + this.toFiniteNumber(pack?.totals?.revenue), 0);
    const interactions = packs.reduce((sum, pack) => sum + this.getDashboardInteractionCount(pack?.totals || {}), 0);
    const uniqueUsers = Math.max(
      ...packs.map((pack) => this.toFiniteNumber(pack?.totals?.preciseUniqueUsers || pack?.totals?.uniqueUsers)),
      isFilteredContentView ? 0 : this.toFiniteNumber(overview?.totals?.uniqueUsers),
      0,
    );
    const revenueTotal = this.toFiniteNumber(revenue?.totalRevenue) ||
      packRevenue ||
      (isFilteredContentView ? 0 : this.toFiniteNumber(overview?.revenue?.total));

    return {
      revenue: this.round2(revenueTotal),
      members: Math.round(uniqueUsers),
      enrollments: Math.round(starts),
      interactions: Math.round(interactions),
      views: Math.round(views),
      completions: Math.round(completes),
      completionRate: starts > 0 ? this.round2((completes / starts) * 100) : 0,
      engagementRate: views > 0 ? this.round2(((interactions + starts + completes) / views) * 100) : 0,
      avgDuration: starts > 0 ? Math.round((watchTime / starts) / 60) : 0,
    };
  }

  private buildDashboardRevenueByType(packs: any[], revenue: any) {
    const byType = new Map<string, number>();
    for (const pack of packs) {
      byType.set(pack.contentType, (byType.get(pack.contentType) || 0) + this.toFiniteNumber(pack?.totals?.revenue));
    }
    if ([...byType.values()].every((value) => value === 0)) {
      for (const item of revenue?.byContent || []) {
        const type = String(item?.contentType || 'unknown');
        byType.set(type, (byType.get(type) || 0) + this.toFiniteNumber(item?.revenue));
      }
    }
    return Array.from(byType.entries())
      .map(([type, value]) => ({
        label: this.titleCase(type === 'course' ? 'Courses' : `${type}s`),
        type,
        value: this.round2(value),
        color: this.getDashboardTypeColor(type),
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }

  private buildDashboardMemberSources(rows: any[]) {
    const channelTotals = rows.reduce((acc: Record<string, number>, row: any) => {
      const channel = String(row?.channel || 'direct');
      acc[channel] = (acc[channel] || 0) + this.toFiniteNumber(row?.count);
      return acc;
    }, {});
    const total = (Object.values(channelTotals) as number[]).reduce((sum, value) => sum + value, 0);
    const colors: Record<string, string> = {
      direct: 'var(--p)',
      referral: 'var(--orange)',
      social: 'var(--cyan)',
      search: 'var(--pink)',
      email: '#16a34a',
      paid: '#f97316',
    };
    return (Object.entries(channelTotals) as Array<[string, number]>)
      .map(([channel, count]) => ({
        label: this.titleCase(channel === 'direct' ? 'Direct Link' : channel),
        channel,
        value: total > 0 ? this.round2((count / total) * 100) : 0,
        count,
        color: colors[channel] || 'var(--p)',
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  private buildDashboardContentPerformance(packs: any[]) {
    const rows: any[] = [];
    for (const pack of packs) {
      const leaderboard = this.getDashboardChart(pack, 'content-leaderboard')?.data || [];
      const revenueByContent = new Map<string, number>(
        (this.getDashboardChart(pack, 'revenue-by-content')?.data || []).map((item: any) => [
          String(item?.contentId || ''),
          this.toFiniteNumber(item?.revenue),
        ]),
      );
      for (const item of leaderboard) {
        const contentId = String(item?.contentId || '');
        const interactions = this.getDashboardInteractionCount(item);
        rows.push({
          id: contentId || `${pack.contentType}-${rows.length}`,
          title: String(item?.title || contentId || 'Untitled'),
          type: pack.contentType,
          enrollments: Math.round(pack.contentType === 'post' ? interactions : this.toFiniteNumber(item?.starts)),
          interactions: Math.round(interactions),
          revenue: this.round2(revenueByContent.get(contentId) || this.toFiniteNumber(item?.revenueAttributed)),
          rating: this.round2(this.toFiniteNumber(item?.avgRating || item?.rating || 0)),
          views: Math.round(this.toFiniteNumber(item?.views)),
          completionRate: this.round2(this.toFiniteNumber(item?.completionRate)),
          engagementRate: this.round2(this.toFiniteNumber(item?.engagementRate)),
        });
      }
    }

    return rows.sort((a, b) => {
      if (b.revenue !== a.revenue) return b.revenue - a.revenue;
      return b.views - a.views;
    }).slice(0, 25);
  }

  private resolveDashboardPrecisionLabel(packs: any[]): string {
    const labels = packs.map((pack) => String(pack?.precision?.label || '')).filter(Boolean);
    if (labels.includes('Reliable')) return 'Reliable';
    if (labels.includes('Directional')) return 'Directional';
    if (labels.includes('Low sample')) return 'Low sample';
    return 'No tracked sample yet';
  }

  private getChartContentTypes(): AnalyticsChartContentType[] {
    return ['course', 'challenge', 'session', 'event', 'product', 'post'];
  }

  private normalizeChartContentType(value: string): AnalyticsChartContentType | null {
    const normalized = String(value || '').trim().toLowerCase();
    return this.getChartContentTypes().includes(normalized as AnalyticsChartContentType)
      ? (normalized as AnalyticsChartContentType)
      : null;
  }

  private toFiniteNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private buildAnalyticsChart(params: {
    id: string;
    title: string;
    description: string;
    visualization: AnalyticsChartVisualization;
    metrics: string[];
    data: any[];
    source: string;
    precision: AnalyticsChartPayload['precision'];
    xKey?: string;
    yKeys?: string[];
    valueKey?: string;
    unit?: string;
  }): AnalyticsChartPayload {
    return {
      id: params.id,
      title: params.title,
      description: params.description,
      visualization: params.visualization,
      metrics: params.metrics,
      data: params.data,
      xKey: params.xKey,
      yKeys: params.yKeys,
      valueKey: params.valueKey,
      source: params.source,
      precision: params.precision,
      unit: params.unit,
    };
  }

  private getContentCollectionConfig(type: AnalyticsChartContentType) {
    const configs: Record<AnalyticsChartContentType, { collection: string; creatorField: string; titleFields: string[] }> = {
      course: { collection: 'cours', creatorField: 'creatorId', titleFields: ['titre', 'title', 'name'] },
      challenge: { collection: 'challenges', creatorField: 'creatorId', titleFields: ['title', 'name'] },
      session: { collection: 'sessions', creatorField: 'creatorId', titleFields: ['title', 'name'] },
      event: { collection: 'events', creatorField: 'creatorId', titleFields: ['title', 'name'] },
      product: { collection: 'products', creatorField: 'creatorId', titleFields: ['name', 'title'] },
      post: { collection: 'posts', creatorField: 'authorId', titleFields: ['title', 'content', 'name'] },
    };
    return configs[type];
  }

  private getDailyChartMetricKeys(type: AnalyticsChartContentType): string[] {
    const common = ['views', 'starts', 'completes', 'uniqueUsers'];
    const byType: Record<AnalyticsChartContentType, string[]> = {
      course: ['chapterCompletes', 'watchTime', 'ratingsCount', 'revenueAttributed'],
      challenge: ['likes', 'shares', 'bookmarks', 'comments', 'activeStreaks', 'maxStreakDays'],
      session: ['sessionShowUps', 'sessionNoShows', 'sessionRebookings', 'ratingsCount', 'revenueAttributed'],
      event: ['likes', 'shares', 'revenueAttributed'],
      product: ['likes', 'shares', 'downloads', 'bookmarks', 'revenueAttributed'],
      post: ['likes', 'shares', 'bookmarks', 'comments', 'ratingsCount'],
    };

    return Array.from(new Set([...common, ...byType[type]]));
  }

  private getFunnelStepsForContentType(type: AnalyticsChartContentType): Array<{ key: string; label: string }> {
    if (type === 'course') {
      return [
        { key: TrackingActionType.VIEW, label: 'Views' },
        { key: TrackingActionType.START, label: 'Course starts' },
        { key: TrackingActionType.CHAPTER_START, label: 'Chapter starts' },
        { key: TrackingActionType.CHAPTER_COMPLETE, label: 'Chapter completes' },
        { key: TrackingActionType.COMPLETE, label: 'Course completes' },
      ];
    }

    if (type === 'challenge') {
      return [
        { key: TrackingActionType.VIEW, label: 'Views' },
        { key: TrackingActionType.START, label: 'Participants' },
        { key: TrackingActionType.COMPLETE, label: 'Submissions' },
        { key: TrackingActionType.CHALLENGE_STREAK, label: 'Streak actions' },
      ];
    }

    if (type === 'session') {
      return [
        { key: TrackingActionType.VIEW, label: 'Views' },
        { key: TrackingActionType.START, label: 'Bookings' },
        { key: TrackingActionType.SESSION_SHOW, label: 'Show-ups' },
        { key: TrackingActionType.SESSION_NOSHOW, label: 'No-shows' },
        { key: TrackingActionType.SESSION_REBOOK, label: 'Rebookings' },
      ];
    }

    if (type === 'post') {
      return [
        { key: TrackingActionType.VIEW, label: 'Views' },
        { key: TrackingActionType.LIKE, label: 'Likes' },
        { key: TrackingActionType.COMMENT, label: 'Comments' },
        { key: TrackingActionType.SHARE, label: 'Shares' },
        { key: TrackingActionType.BOOKMARK, label: 'Bookmarks' },
      ];
    }

    if (type === 'product') {
      return [
        { key: TrackingActionType.VIEW, label: 'Views' },
        { key: TrackingActionType.LIKE, label: 'Likes' },
        { key: TrackingActionType.SHARE, label: 'Shares' },
        { key: TrackingActionType.DOWNLOAD, label: 'Downloads' },
      ];
    }

    return [
      { key: TrackingActionType.VIEW, label: 'Views' },
      { key: TrackingActionType.START, label: type === 'event' ? 'Registrations' : 'Starts' },
      { key: TrackingActionType.COMPLETE, label: type === 'event' ? 'Attended' : 'Completes' },
      { key: TrackingActionType.SHARE, label: 'Shares' },
    ];
  }

  private getPrimaryMetricForContentType(type: AnalyticsChartContentType): string {
    if (type === 'product') return 'revenueAttributed';
    if (type === 'post') return 'likes';
    if (type === 'challenge') return 'completes';
    if (type === 'session' || type === 'event') return 'starts';
    return 'views';
  }

  private getContentTitleFromDoc(doc: any, fallback: string): string {
    if (!doc) return fallback;
    const candidates = [doc.titre, doc.title, doc.name, doc.slug, doc.content, doc.id, doc._id];
    const value = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0);
    if (!value) return fallback;
    const text = String(value).trim();
    return text.length > 80 ? `${text.slice(0, 77)}...` : text;
  }

  private buildContentLookupForCharts(type: AnalyticsChartContentType, localField = 'contentId', alias = 'contentDoc') {
    const config = this.getContentCollectionConfig(type);
    return {
      $lookup: {
        from: config.collection,
        let: { lookupContentId: `$${localField}` },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ['$id', '$$lookupContentId'] },
                  { $eq: [{ $toString: '$_id' }, '$$lookupContentId'] },
                ],
              },
            },
          },
          {
            $project: {
              id: 1,
              titre: 1,
              title: 1,
              name: 1,
              slug: 1,
              content: 1,
              communityId: 1,
              prix: 1,
              price: 1,
              devise: 1,
            },
          },
          { $limit: 1 },
        ],
        as: alias,
      },
    } as any;
  }

  private buildDailyChartMatch(
    creatorId: string,
    contentType: AnalyticsChartContentType,
    from: Date,
    to: Date,
    communityScope: { hasFilter: boolean; communityIdStrings: string[] },
    contentMeta?: AnalyticsChartContentMeta | null,
  ) {
    const match: Record<string, any> = {
      creatorId: this.getCreatorObjectId(creatorId),
      contentType,
      date: { $gte: from, $lte: to },
    };
    if (communityScope.hasFilter) this.setDailyCommunityFilter(match, communityScope.communityIdStrings);
    if (contentMeta?.trackingIds?.length) {
      match.contentId = { $in: contentMeta.trackingIds };
    }
    return match;
  }

  private buildTrackingChartPipeline(
    creatorId: string,
    contentType: AnalyticsChartContentType,
    from: Date,
    to: Date,
    communityScope: { hasFilter: boolean; lookupCommunityValues: Array<string | Types.ObjectId> },
    contentMeta?: AnalyticsChartContentMeta | null,
  ) {
    const pipeline = this.buildTrackingScopePipeline(creatorId, from, to, communityScope);
    const match: Record<string, any> = { contentType };
    if (contentMeta?.trackingIds?.length) {
      match.contentId = { $in: contentMeta.trackingIds };
    }
    pipeline.push({ $match: match });
    return pipeline;
  }

  private async getDailySeriesForCharts(
    creatorId: string,
    contentType: AnalyticsChartContentType,
    from: Date,
    to: Date,
    communityScope: { hasFilter: boolean; communityIdStrings: string[] },
    contentMeta?: AnalyticsChartContentMeta | null,
  ) {
    const metrics = this.getDailyChartMetricKeys(contentType);
    const group: Record<string, any> = {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
    };
    for (const metric of metrics) {
      group[metric] = { $sum: `$${metric}` };
    }

    const rows = await this.dailyModel.aggregate([
      { $match: this.buildDailyChartMatch(creatorId, contentType, from, to, communityScope, contentMeta) },
      { $group: group },
      { $sort: { _id: 1 } },
    ]);

    return rows.map((row: any) => {
      const item: Record<string, any> = { date: row._id };
      for (const metric of metrics) {
        item[metric] = this.toFiniteNumber(row?.[metric]);
      }
      item.completionRate = item.starts > 0 ? this.round2((item.completes / item.starts) * 100) : 0;
      item.engagementRate = item.views > 0
        ? this.round2(((item.likes || 0) + (item.shares || 0) + (item.bookmarks || 0) + (item.comments || 0)) / item.views * 100)
        : 0;
      return item;
    });
  }

  private sumDailyRows(rows: any[], metrics: string[]) {
    const totals = metrics.reduce<Record<string, number>>((acc, metric) => {
      acc[metric] = 0;
      return acc;
    }, {});

    for (const row of rows) {
      for (const metric of metrics) {
        totals[metric] += this.toFiniteNumber(row?.[metric]);
      }
    }

    totals.completionRate = totals.starts > 0 ? this.round2((totals.completes / totals.starts) * 100) : 0;
    totals.engagementRate = totals.views > 0
      ? this.round2(((totals.likes || 0) + (totals.shares || 0) + (totals.bookmarks || 0) + (totals.comments || 0)) / totals.views * 100)
      : 0;
    totals.avgWatchTimeSeconds = totals.starts > 0 ? this.round2((totals.watchTime || 0) / totals.starts) : 0;
    return totals;
  }

  private async getTrackingActionBreakdownForCharts(
    creatorId: string,
    contentType: AnalyticsChartContentType,
    from: Date,
    to: Date,
    communityScope: { hasFilter: boolean; lookupCommunityValues: Array<string | Types.ObjectId> },
    contentMeta?: AnalyticsChartContentMeta | null,
  ) {
    const tracking = this.dbConnection.collection('trackingactions');
    const rows = await tracking.aggregate([
      ...this.buildTrackingChartPipeline(creatorId, contentType, from, to, communityScope, contentMeta),
      {
        $group: {
          _id: '$actionType',
          events: { $sum: 1 },
          users: { $addToSet: '$userId' },
          lastSeenAt: { $max: '$timestamp' },
        },
      },
      {
        $project: {
          _id: 0,
          actionType: '$_id',
          events: 1,
          uniqueUsers: { $size: '$users' },
          lastSeenAt: 1,
        },
      },
      { $sort: { events: -1 } },
    ]).toArray();

    return rows.map((row: any) => ({
      actionType: String(row.actionType || 'unknown'),
      events: this.toFiniteNumber(row.events),
      uniqueUsers: this.toFiniteNumber(row.uniqueUsers),
      lastSeenAt: row.lastSeenAt || null,
    }));
  }

  private async getTrackingActionTrendForCharts(
    creatorId: string,
    contentType: AnalyticsChartContentType,
    from: Date,
    to: Date,
    communityScope: { hasFilter: boolean; lookupCommunityValues: Array<string | Types.ObjectId> },
    contentMeta?: AnalyticsChartContentMeta | null,
  ) {
    const tracking = this.dbConnection.collection('trackingactions');
    const rows = await tracking.aggregate([
      ...this.buildTrackingChartPipeline(creatorId, contentType, from, to, communityScope, contentMeta),
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            actionType: '$actionType',
          },
          events: { $sum: 1 },
          users: { $addToSet: '$userId' },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]).toArray();

    const byDate = new Map<string, Record<string, any>>();
    for (const row of rows) {
      const date = String(row?._id?.date || '');
      const actionType = String(row?._id?.actionType || 'unknown');
      if (!date) continue;
      if (!byDate.has(date)) byDate.set(date, { date });
      const target = byDate.get(date)!;
      target[actionType] = this.toFiniteNumber(row.events);
      target[`${actionType}Users`] = Array.isArray(row.users) ? row.users.length : 0;
    }
    return Array.from(byDate.values());
  }

  private async getActivityHeatmapForCharts(
    creatorId: string,
    contentType: AnalyticsChartContentType,
    from: Date,
    to: Date,
    communityScope: { hasFilter: boolean; lookupCommunityValues: Array<string | Types.ObjectId> },
    contentMeta?: AnalyticsChartContentMeta | null,
  ) {
    const tracking = this.dbConnection.collection('trackingactions');
    const rows = await tracking.aggregate([
      ...this.buildTrackingChartPipeline(creatorId, contentType, from, to, communityScope, contentMeta),
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: '$timestamp' },
            hour: { $hour: '$timestamp' },
          },
          events: { $sum: 1 },
          users: { $addToSet: '$userId' },
        },
      },
      { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } },
    ]).toArray();

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return rows.map((row: any) => {
      const dayIndex = Math.max(1, Math.min(7, Number(row?._id?.dayOfWeek || 1))) - 1;
      return {
        dayOfWeek: row?._id?.dayOfWeek,
        day: dayLabels[dayIndex],
        hour: this.toFiniteNumber(row?._id?.hour),
        events: this.toFiniteNumber(row.events),
        uniqueUsers: Array.isArray(row.users) ? row.users.length : 0,
      };
    });
  }

  private async getDeviceBreakdownForCharts(
    creatorId: string,
    contentType: AnalyticsChartContentType,
    from: Date,
    to: Date,
    communityScope: { hasFilter: boolean; lookupCommunityValues: Array<string | Types.ObjectId> },
    contentMeta?: AnalyticsChartContentMeta | null,
  ) {
    const tracking = this.dbConnection.collection('trackingactions');
    const basePipeline = this.buildTrackingChartPipeline(creatorId, contentType, from, to, communityScope, contentMeta);
    const rows = await tracking.aggregate(this.buildDeviceAggregatePipeline(basePipeline)).toArray();
    return rows
      .filter((row: any) => this.isMeaningfulDeviceValue(row?.device))
      .slice(0, 12)
      .map((row: any) => ({
        device: String(row.device || 'unknown'),
        os: String(row.os || 'unknown'),
        browser: String(row.browser || 'unknown'),
        users: this.toFiniteNumber(row.count),
      }));
  }

  private async getReferrerBreakdownForCharts(
    creatorId: string,
    contentType: AnalyticsChartContentType,
    from: Date,
    to: Date,
    communityScope: { hasFilter: boolean; lookupCommunityValues: Array<string | Types.ObjectId> },
    contentMeta?: AnalyticsChartContentMeta | null,
  ) {
    const tracking = this.dbConnection.collection('trackingactions');
    const rows = await tracking.aggregate([
      ...this.buildTrackingChartPipeline(creatorId, contentType, from, to, communityScope, contentMeta),
      {
        $project: {
          userId: 1,
          timestamp: 1,
          referrer: '$metadata.referrer',
          utm_source: '$metadata.utm_source',
          utm_medium: '$metadata.utm_medium',
          utm_campaign: '$metadata.utm_campaign',
        },
      },
      {
        $group: {
          _id: {
            referrer: '$referrer',
            utm_source: '$utm_source',
            utm_medium: '$utm_medium',
            utm_campaign: '$utm_campaign',
          },
          count: { $sum: 1 },
          users: { $addToSet: '$userId' },
          lastSeenAt: { $max: '$timestamp' },
        },
      },
      {
        $project: {
          _id: 0,
          referrer: '$_id.referrer',
          utm_source: '$_id.utm_source',
          utm_medium: '$_id.utm_medium',
          utm_campaign: '$_id.utm_campaign',
          count: 1,
          uniqueUsers: { $size: '$users' },
          lastSeenAt: 1,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 50 },
    ]).toArray();

    const formatted = this.formatReferrerRows(rows);
    const total = formatted.reduce((sum: number, row: any) => sum + this.toFiniteNumber(row.count), 0);
    return formatted.map((row: any) => ({
      ...row,
      share: total > 0 ? this.round2((this.toFiniteNumber(row.count) / total) * 100) : 0,
    }));
  }

  private async getContentLeaderboardForCharts(
    creatorId: string,
    contentType: AnalyticsChartContentType,
    from: Date,
    to: Date,
    communityScope: { hasFilter: boolean; communityIdStrings: string[] },
    contentMeta?: AnalyticsChartContentMeta | null,
  ) {
    const metrics = this.getDailyChartMetricKeys(contentType);
    const group: Record<string, any> = { _id: '$contentId' };
    for (const metric of metrics) {
      group[metric] = { $sum: `$${metric}` };
    }

    const rows = await this.dailyModel.aggregate([
      { $match: this.buildDailyChartMatch(creatorId, contentType, from, to, communityScope, contentMeta) },
      { $group: group },
      { $project: { _id: 0, contentId: '$_id', ...metrics.reduce<Record<string, number>>((acc, metric) => ({ ...acc, [metric]: 1 }), {}) } },
      this.buildContentLookupForCharts(contentType),
      { $addFields: { contentDoc: { $arrayElemAt: ['$contentDoc', 0] } } },
      { $sort: { [this.getPrimaryMetricForContentType(contentType)]: -1, views: -1 } },
      { $limit: 25 },
    ]);

    return rows.map((row: any) => ({
      contentId: String(row.contentId || ''),
      title: this.getContentTitleFromDoc(row.contentDoc, String(row.contentId || 'Untitled')),
      ...metrics.reduce<Record<string, number>>((acc, metric) => {
        acc[metric] = this.toFiniteNumber(row?.[metric]);
        return acc;
      }, {}),
      completionRate: this.toFiniteNumber(row.starts) > 0
        ? this.round2((this.toFiniteNumber(row.completes) / this.toFiniteNumber(row.starts)) * 100)
        : 0,
      engagementRate: this.toFiniteNumber(row.views) > 0
        ? this.round2(((this.toFiniteNumber(row.likes) + this.toFiniteNumber(row.shares) + this.toFiniteNumber(row.bookmarks) + this.toFiniteNumber(row.comments)) / this.toFiniteNumber(row.views)) * 100)
        : 0,
    }));
  }

  private buildOrderScopeStagesForCharts(
    contentType: AnalyticsChartContentType,
    communityScope: { hasFilter: boolean; lookupCommunityValues: Array<string | Types.ObjectId> },
  ) {
    if (!communityScope.hasFilter) return [];
    const config = this.getContentCollectionConfig(contentType);
    return [
      this.buildOrderContentCommunityLookup(config.collection, contentType, 'orderContentDoc'),
      {
        $addFields: {
          resolvedCommunityId: {
            $ifNull: ['$communityId', { $arrayElemAt: ['$orderContentDoc.communityId', 0] }],
          },
        },
      },
      { $match: { resolvedCommunityId: { $in: communityScope.lookupCommunityValues } } },
    ];
  }

  private async getOrderChartsForContentType(
    creatorId: string,
    contentType: AnalyticsChartContentType,
    from: Date,
    to: Date,
    communityScope: { hasFilter: boolean; lookupCommunityValues: Array<string | Types.ObjectId> },
    contentMeta?: AnalyticsChartContentMeta | null,
  ) {
    const ordersCollection = this.dbConnection.db?.collection('orders');
    if (!ordersCollection || contentType === 'post') {
      return { totals: { revenue: 0, orders: 0, uniqueBuyers: 0, avgOrderValue: 0 }, trend: [], byContent: [] };
    }

    const match: Record<string, any> = {
      creatorId: this.getCreatorObjectId(creatorId),
      status: 'paid',
      contentType,
      createdAt: { $gte: from, $lte: to },
    };
    if (contentMeta?.orderIds?.length) {
      match.contentId = { $in: contentMeta.orderIds };
    }

    const scopeStages = this.buildOrderScopeStagesForCharts(contentType, communityScope);
    const revenueExpr = { $ifNull: ['$creatorNetDT', 0] };

    const [trend, byContent, totalsRows] = await Promise.all([
      ordersCollection.aggregate([
        { $match: match },
        ...scopeStages,
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: revenueExpr },
            orders: { $sum: 1 },
            buyers: { $addToSet: '$buyerId' },
          },
        },
        { $sort: { _id: 1 } },
      ]).toArray(),
      ordersCollection.aggregate([
        { $match: match },
        ...scopeStages,
        {
          $group: {
            _id: '$contentId',
            revenue: { $sum: revenueExpr },
            orders: { $sum: 1 },
            buyers: { $addToSet: '$buyerId' },
          },
        },
        { $project: { _id: 0, contentId: '$_id', revenue: 1, orders: 1, uniqueBuyers: { $size: '$buyers' } } },
        this.buildContentLookupForCharts(contentType),
        { $addFields: { contentDoc: { $arrayElemAt: ['$contentDoc', 0] } } },
        { $sort: { revenue: -1 } },
        { $limit: 25 },
      ]).toArray(),
      ordersCollection.aggregate([
        { $match: match },
        ...scopeStages,
        {
          $group: {
            _id: null,
            revenue: { $sum: revenueExpr },
            orders: { $sum: 1 },
            buyers: { $addToSet: '$buyerId' },
          },
        },
        { $project: { _id: 0, revenue: 1, orders: 1, uniqueBuyers: { $size: '$buyers' } } },
      ]).toArray(),
    ]);

    const totals = {
      revenue: this.round2(this.toFiniteNumber(totalsRows?.[0]?.revenue)),
      orders: this.toFiniteNumber(totalsRows?.[0]?.orders),
      uniqueBuyers: this.toFiniteNumber(totalsRows?.[0]?.uniqueBuyers),
      avgOrderValue: this.toFiniteNumber(totalsRows?.[0]?.orders) > 0
        ? this.round2(this.toFiniteNumber(totalsRows?.[0]?.revenue) / this.toFiniteNumber(totalsRows?.[0]?.orders))
        : 0,
    };

    return {
      totals,
      trend: trend.map((row: any) => ({
        date: row._id,
        revenue: this.round2(this.toFiniteNumber(row.revenue)),
        orders: this.toFiniteNumber(row.orders),
        uniqueBuyers: Array.isArray(row.buyers) ? row.buyers.length : 0,
      })),
      byContent: byContent.map((row: any) => ({
        contentId: String(row.contentId || ''),
        title: this.getContentTitleFromDoc(row.contentDoc, String(row.contentId || 'Untitled')),
        revenue: this.round2(this.toFiniteNumber(row.revenue)),
        orders: this.toFiniteNumber(row.orders),
        uniqueBuyers: this.toFiniteNumber(row.uniqueBuyers),
      })),
    };
  }

  private async getCourseSpecificCharts(
    creatorId: string,
    from: Date,
    to: Date,
    communityScope: { hasFilter: boolean; lookupCommunityValues: Array<string | Types.ObjectId> },
    contentMeta?: AnalyticsChartContentMeta | null,
  ) {
    const coursesCollection = this.dbConnection.db?.collection('cours');
    const enrollmentsCollection = this.dbConnection.db?.collection('courseenrollments');
    if (!coursesCollection || !enrollmentsCollection) return { charts: [], totals: {}, sources: [] };

    const courseQuery: Record<string, any> = { creatorId: this.getCreatorObjectId(creatorId) };
    if (communityScope.hasFilter) {
      courseQuery.communityId = { $in: communityScope.lookupCommunityValues };
    }
    if (contentMeta?.trackingIds?.length) {
      const objectIds = contentMeta.trackingIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
      courseQuery.$or = [
        { id: { $in: contentMeta.trackingIds } },
        ...(objectIds.length ? [{ _id: { $in: objectIds } }] : []),
      ];
    }

    const courses = await coursesCollection
      .find(courseQuery)
      .project({ _id: 1, id: 1, titre: 1, title: 1, prix: 1, devise: 1 })
      .toArray();
    const courseObjectIds = courses.map((course: any) => course._id).filter(Boolean);
    if (!courseObjectIds.length) return { charts: [], totals: {}, sources: ['courseenrollments'] };

    const enrollmentBase = [
      { $match: { courseId: { $in: courseObjectIds } } },
      { $addFields: { enrollmentDate: { $ifNull: ['$enrolledAt', '$createdAt'] } } },
      { $match: { enrollmentDate: { $gte: from, $lte: to } } },
    ];

    const [trend, progressBuckets] = await Promise.all([
      enrollmentsCollection.aggregate([
        ...enrollmentBase,
        {
          $group: {
            _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$enrollmentDate' } }, courseId: '$courseId' },
            enrollments: { $sum: 1 },
            completed: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $ne: ['$completedAt', null] },
                      { $eq: ['$isCompleted', true] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $group: { _id: '$_id.date', enrollments: { $sum: '$enrollments' }, completed: { $sum: '$completed' } } },
        { $sort: { _id: 1 } },
      ]).toArray(),
      enrollmentsCollection.aggregate([
        ...enrollmentBase,
        {
          $project: {
            progressItems: { $cond: [{ $isArray: '$progression' }, '$progression', []] },
          },
        },
        {
          $project: {
            progressPercent: {
              $cond: [
                { $gt: [{ $size: '$progressItems' }, 0] },
                {
                  $multiply: [
                    {
                      $divide: [
                        {
                          $size: {
                            $filter: {
                              input: '$progressItems',
                              as: 'progress',
                              cond: { $eq: ['$$progress.isCompleted', true] },
                            },
                          },
                        },
                        { $size: '$progressItems' },
                      ],
                    },
                    100,
                  ],
                },
                0,
              ],
            },
            watchTimeSeconds: {
              $sum: {
                $map: {
                  input: '$progressItems',
                  as: 'progress',
                  in: { $ifNull: ['$$progress.watchTime', 0] },
                },
              },
            },
          },
        },
        {
          $bucket: {
            groupBy: '$progressPercent',
            boundaries: [0, 25, 50, 75, 100, 101],
            default: 'unknown',
            output: {
              learners: { $sum: 1 },
              avgWatchTimeSeconds: { $avg: '$watchTimeSeconds' },
            },
          },
        },
      ]).toArray(),
    ]);

    const charts: AnalyticsChartPayload[] = [
      this.buildAnalyticsChart({
        id: 'course-enrollment-trend',
        title: 'Enrollment and Completion Trend',
        description: 'Daily course enrollments and completed enrollments from enrollment records.',
        visualization: 'line',
        metrics: ['enrollments', 'completed'],
        xKey: 'date',
        yKeys: ['enrollments', 'completed'],
        source: 'courseenrollments',
        precision: 'exact',
        data: trend.map((row: any) => ({
          date: row._id,
          enrollments: this.toFiniteNumber(row.enrollments),
          completed: this.toFiniteNumber(row.completed),
          completionRate: this.toFiniteNumber(row.enrollments) > 0
            ? this.round2((this.toFiniteNumber(row.completed) / this.toFiniteNumber(row.enrollments)) * 100)
            : 0,
        })),
      }),
      this.buildAnalyticsChart({
        id: 'course-progress-distribution',
        title: 'Learner Progress Distribution',
        description: 'Learners grouped by how much of the course they completed.',
        visualization: 'bar',
        metrics: ['learners', 'avgWatchTimeSeconds'],
        xKey: 'bucket',
        yKeys: ['learners'],
        source: 'courseenrollments.progression',
        precision: 'exact',
        data: progressBuckets.map((row: any) => {
          const bucket = row._id === 'unknown' ? 'Unknown' : `${row._id}-${row._id === 100 ? 100 : Number(row._id) + 24}%`;
          return {
            bucket,
            learners: this.toFiniteNumber(row.learners),
            avgWatchTimeSeconds: this.round2(this.toFiniteNumber(row.avgWatchTimeSeconds)),
          };
        }),
      }),
    ];

    if (contentMeta?.trackingIds?.length) {
      try {
        const chapters = await this.getCourseChaptersFunnel(
          creatorId,
          contentMeta.trackingIds[0],
          from,
          to,
          communityScope.hasFilter ? communityScope.lookupCommunityValues[0]?.toString() : undefined,
        );
        charts.push(this.buildAnalyticsChart({
          id: 'course-chapter-dropoff',
          title: 'Chapter Drop-off',
          description: 'Start and completion counts for each chapter in the selected course.',
          visualization: 'bar',
          metrics: ['uniqueStarts', 'uniqueCompletes', 'dropOffRate'],
          xKey: 'stepTitle',
          yKeys: ['uniqueStarts', 'uniqueCompletes'],
          source: 'trackingactions.metadata.chapterId',
          precision: 'exact',
          data: chapters.items || [],
        }));
      } catch {
        // The generic chart pack should still be usable when chapter metadata is unavailable.
      }
    }

    const totals = trend.reduce(
      (acc: any, row: any) => {
        acc.enrollments += this.toFiniteNumber(row.enrollments);
        acc.completedEnrollments += this.toFiniteNumber(row.completed);
        return acc;
      },
      { enrollments: 0, completedEnrollments: 0 },
    );

    return { charts, totals, sources: ['courseenrollments'] };
  }

  private async getChallengeSpecificCharts(
    creatorId: string,
    from: Date,
    to: Date,
    communityScope: { hasFilter: boolean; lookupCommunityValues: Array<string | Types.ObjectId> },
    contentMeta?: AnalyticsChartContentMeta | null,
  ) {
    const challengesCollection = this.dbConnection.db?.collection('challenges');
    const submissionsCollection = this.dbConnection.db?.collection('challengesubmissions');
    if (!challengesCollection || !submissionsCollection) return { charts: [], totals: {}, sources: [] };

    const challengeQuery: Record<string, any> = { creatorId: this.getCreatorObjectId(creatorId) };
    if (communityScope.hasFilter) {
      challengeQuery.communityId = { $in: communityScope.lookupCommunityValues };
    }
    if (contentMeta?.trackingIds?.length) {
      const objectIds = contentMeta.trackingIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
      challengeQuery.$or = [
        { id: { $in: contentMeta.trackingIds } },
        ...(objectIds.length ? [{ _id: { $in: objectIds } }] : []),
      ];
    }

    const challenges = await challengesCollection.find(challengeQuery).project({ _id: 1, id: 1, title: 1, tasks: 1 }).toArray();
    const challengeObjectIds = challenges.map((challenge: any) => challenge._id).filter(Boolean);
    if (!challengeObjectIds.length) return { charts: [], totals: {}, sources: ['challengesubmissions'] };

    const baseMatch = { challengeId: { $in: challengeObjectIds }, createdAt: { $gte: from, $lte: to } };
    const [statusRows, trendRows, taskRows] = await Promise.all([
      submissionsCollection.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$status', submissions: { $sum: 1 }, users: { $addToSet: '$userId' } } },
        { $project: { _id: 0, status: '$_id', submissions: 1, uniqueUsers: { $size: '$users' } } },
        { $sort: { submissions: -1 } },
      ]).toArray(),
      submissionsCollection.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, status: '$status' },
            submissions: { $sum: 1 },
          },
        },
        { $sort: { '_id.date': 1 } },
      ]).toArray(),
      submissionsCollection.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$taskId', submissions: { $sum: 1 }, approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } }, users: { $addToSet: '$userId' } } },
        { $project: { _id: 0, taskId: '$_id', submissions: 1, approved: 1, uniqueUsers: { $size: '$users' } } },
        { $sort: { submissions: -1 } },
        { $limit: 25 },
      ]).toArray(),
    ]);

    const byDate = new Map<string, Record<string, any>>();
    for (const row of trendRows) {
      const date = String(row?._id?.date || '');
      const status = String(row?._id?.status || 'unknown');
      if (!date) continue;
      if (!byDate.has(date)) byDate.set(date, { date });
      byDate.get(date)![status] = this.toFiniteNumber(row.submissions);
    }

    const charts: AnalyticsChartPayload[] = [
      this.buildAnalyticsChart({
        id: 'challenge-submission-status',
        title: 'Submission Status',
        description: 'Challenge submissions grouped by review status.',
        visualization: 'donut',
        metrics: ['submissions', 'uniqueUsers'],
        valueKey: 'submissions',
        source: 'challengesubmissions',
        precision: 'exact',
        data: statusRows,
      }),
      this.buildAnalyticsChart({
        id: 'challenge-submission-trend',
        title: 'Submission Trend by Status',
        description: 'Daily challenge submissions split by review status.',
        visualization: 'stacked_bar',
        metrics: ['pending', 'approved', 'rejected', 'feedback_required'],
        xKey: 'date',
        yKeys: ['pending', 'approved', 'rejected', 'feedback_required'],
        source: 'challengesubmissions',
        precision: 'exact',
        data: Array.from(byDate.values()),
      }),
      this.buildAnalyticsChart({
        id: 'challenge-task-submissions',
        title: 'Task Submission Volume',
        description: 'Which challenge tasks receive the most submissions.',
        visualization: 'bar',
        metrics: ['submissions', 'approved', 'uniqueUsers'],
        xKey: 'taskId',
        yKeys: ['submissions', 'approved'],
        source: 'challengesubmissions.taskId',
        precision: 'exact',
        data: taskRows,
      }),
    ];

    if (contentMeta?.trackingIds?.length) {
      try {
        const tasks = await this.getChallengeTasksFunnel(
          creatorId,
          contentMeta.trackingIds[0],
          from,
          to,
          communityScope.hasFilter ? communityScope.lookupCommunityValues[0]?.toString() : undefined,
        );
        charts.push(this.buildAnalyticsChart({
          id: 'challenge-task-dropoff',
          title: 'Task Drop-off',
          description: 'Start and completion counts for each task in the selected challenge.',
          visualization: 'bar',
          metrics: ['uniqueStarts', 'uniqueCompletes', 'dropOffRate'],
          xKey: 'stepTitle',
          yKeys: ['uniqueStarts', 'uniqueCompletes'],
          source: 'trackingactions.metadata.taskId',
          precision: 'exact',
          data: tasks.items || [],
        }));
      } catch {
        // Keep the rest of the chart pack available.
      }
    }

    const totals = statusRows.reduce(
      (acc: any, row: any) => {
        acc.submissions += this.toFiniteNumber(row.submissions);
        acc.uniqueSubmitters += this.toFiniteNumber(row.uniqueUsers);
        if (row.status === 'approved') acc.approved += this.toFiniteNumber(row.submissions);
        return acc;
      },
      { submissions: 0, approved: 0, uniqueSubmitters: 0 },
    );

    return { charts, totals, sources: ['challengesubmissions'] };
  }

  private buildTypeSpecificSnapshotChart(
    contentType: AnalyticsChartContentType,
    totals: Record<string, number>,
    actionMap: Map<string, any>,
    orderTotals: any,
  ): AnalyticsChartPayload {
    const actionValue = (actionType: string) => this.toFiniteNumber(actionMap.get(actionType)?.events);

    const rowsByType: Record<AnalyticsChartContentType, any[]> = {
      course: [
        { label: 'Views', value: totals.views || actionValue(TrackingActionType.VIEW) },
        { label: 'Starts', value: totals.starts || actionValue(TrackingActionType.START) },
        { label: 'Chapter completes', value: totals.chapterCompletes || actionValue(TrackingActionType.CHAPTER_COMPLETE) },
        { label: 'Course completes', value: totals.completes || actionValue(TrackingActionType.COMPLETE) },
        { label: 'Purchases', value: this.toFiniteNumber(orderTotals.orders) },
      ],
      challenge: [
        { label: 'Views', value: totals.views || actionValue(TrackingActionType.VIEW) },
        { label: 'Participants', value: totals.starts || actionValue(TrackingActionType.START) },
        { label: 'Submissions', value: totals.completes || actionValue(TrackingActionType.COMPLETE) },
        { label: 'Streak actions', value: totals.activeStreaks || actionValue(TrackingActionType.CHALLENGE_STREAK) },
        { label: 'Comments', value: totals.comments || actionValue(TrackingActionType.COMMENT) },
      ],
      session: [
        { label: 'Views', value: totals.views || actionValue(TrackingActionType.VIEW) },
        { label: 'Bookings', value: totals.starts || actionValue(TrackingActionType.START) },
        { label: 'Show-ups', value: totals.sessionShowUps || actionValue(TrackingActionType.SESSION_SHOW) },
        { label: 'No-shows', value: totals.sessionNoShows || actionValue(TrackingActionType.SESSION_NOSHOW) },
        { label: 'Rebookings', value: totals.sessionRebookings || actionValue(TrackingActionType.SESSION_REBOOK) },
      ],
      event: [
        { label: 'Views', value: totals.views || actionValue(TrackingActionType.VIEW) },
        { label: 'Registrations', value: totals.starts || actionValue(TrackingActionType.START) },
        { label: 'Attended', value: totals.completes || actionValue(TrackingActionType.COMPLETE) },
        { label: 'Orders', value: this.toFiniteNumber(orderTotals.orders) },
        { label: 'Revenue', value: this.toFiniteNumber(orderTotals.revenue) },
      ],
      product: [
        { label: 'Views', value: totals.views || actionValue(TrackingActionType.VIEW) },
        { label: 'Downloads', value: totals.downloads || actionValue(TrackingActionType.DOWNLOAD) },
        { label: 'Likes', value: totals.likes || actionValue(TrackingActionType.LIKE) },
        { label: 'Orders', value: this.toFiniteNumber(orderTotals.orders) },
        { label: 'Revenue', value: this.toFiniteNumber(orderTotals.revenue) },
      ],
      post: [
        { label: 'Views', value: totals.views || actionValue(TrackingActionType.VIEW) },
        { label: 'Likes', value: totals.likes || actionValue(TrackingActionType.LIKE) },
        { label: 'Comments', value: totals.comments || actionValue(TrackingActionType.COMMENT) },
        { label: 'Shares', value: totals.shares || actionValue(TrackingActionType.SHARE) },
        { label: 'Bookmarks', value: totals.bookmarks || actionValue(TrackingActionType.BOOKMARK) },
      ],
    };

    const titles: Record<AnalyticsChartContentType, string> = {
      course: 'Learning Depth Snapshot',
      challenge: 'Challenge Participation Snapshot',
      session: 'Session Attendance Snapshot',
      event: 'Event Conversion Snapshot',
      product: 'Product Commerce Snapshot',
      post: 'Post Engagement Snapshot',
    };

    return this.buildAnalyticsChart({
      id: `${contentType}-snapshot`,
      title: titles[contentType],
      description: 'Content-specific headline metrics prepared for KPI, bar, or funnel UI.',
      visualization: 'bar',
      metrics: ['value'],
      xKey: 'label',
      yKeys: ['value'],
      valueKey: 'value',
      source: 'analytics_daily + trackingactions + orders',
      precision: 'hybrid',
      data: rowsByType[contentType],
    });
  }

  private async buildContentTypeChartPack(
    creatorId: string,
    contentType: AnalyticsChartContentType,
    from: Date,
    to: Date,
    communityScope: {
      hasFilter: boolean;
      cacheKeyPart: string;
      communityIdStrings: string[];
      lookupCommunityValues: Array<string | Types.ObjectId>;
    },
    contentId?: string,
  ) {
    const contentMeta = contentId
      ? (await this.resolveContentMeta({
          creatorId,
          contentType,
          contentId,
          communityScope,
        }) as AnalyticsChartContentMeta)
      : null;

    const metrics = this.getDailyChartMetricKeys(contentType);
    const [
      dailySeries,
      actionBreakdown,
      actionTrend,
      heatmap,
      devices,
      referrers,
      leaderboard,
      orderCharts,
    ] = await Promise.all([
      this.getDailySeriesForCharts(creatorId, contentType, from, to, communityScope, contentMeta),
      this.getTrackingActionBreakdownForCharts(creatorId, contentType, from, to, communityScope, contentMeta),
      this.getTrackingActionTrendForCharts(creatorId, contentType, from, to, communityScope, contentMeta),
      this.getActivityHeatmapForCharts(creatorId, contentType, from, to, communityScope, contentMeta),
      this.getDeviceBreakdownForCharts(creatorId, contentType, from, to, communityScope, contentMeta),
      this.getReferrerBreakdownForCharts(creatorId, contentType, from, to, communityScope, contentMeta),
      this.getContentLeaderboardForCharts(creatorId, contentType, from, to, communityScope, contentMeta),
      this.getOrderChartsForContentType(creatorId, contentType, from, to, communityScope, contentMeta),
    ]);

    const totals = {
      ...this.sumDailyRows(dailySeries, metrics),
      revenue: this.toFiniteNumber(orderCharts.totals.revenue),
      orders: this.toFiniteNumber(orderCharts.totals.orders),
      uniqueBuyers: this.toFiniteNumber(orderCharts.totals.uniqueBuyers),
      avgOrderValue: this.toFiniteNumber(orderCharts.totals.avgOrderValue),
    };

    const actionMap = new Map(actionBreakdown.map((row: any) => [row.actionType, row]));
    const funnelData = this.getFunnelStepsForContentType(contentType).map((step, index, steps) => {
      const current = actionMap.get(step.key);
      const previous = index > 0 ? actionMap.get(steps[index - 1].key) : null;
      const uniqueUsers = this.toFiniteNumber(current?.uniqueUsers);
      const previousUsers = this.toFiniteNumber(previous?.uniqueUsers);
      return {
        stepKey: step.key,
        stepLabel: step.label,
        events: this.toFiniteNumber(current?.events),
        uniqueUsers,
        rateFromPrevious: index === 0 || previousUsers <= 0 ? null : this.round2((uniqueUsers / previousUsers) * 100),
      };
    });

    if (contentType !== 'post' && orderCharts.totals.orders > 0) {
      const previousUsers = this.toFiniteNumber(funnelData.at(-1)?.uniqueUsers);
      funnelData.push({
        stepKey: 'purchase',
        stepLabel: 'Purchases',
        events: this.toFiniteNumber(orderCharts.totals.orders),
        uniqueUsers: this.toFiniteNumber(orderCharts.totals.uniqueBuyers),
        rateFromPrevious: previousUsers > 0
          ? this.round2((this.toFiniteNumber(orderCharts.totals.uniqueBuyers) / previousUsers) * 100)
          : null,
      });
    }

    const charts: AnalyticsChartPayload[] = [
      this.buildAnalyticsChart({
        id: 'daily-performance',
        title: 'Daily Performance',
        description: 'Daily rollup metrics for this content type.',
        visualization: 'line',
        metrics,
        xKey: 'date',
        yKeys: metrics.filter((metric) => !['revenueAttributed', 'watchTime'].includes(metric)),
        source: 'analytics_daily',
        precision: 'rollup',
        data: dailySeries,
      }),
      this.buildAnalyticsChart({
        id: 'action-trend',
        title: 'Raw Action Trend',
        description: 'Raw tracked events by action type, useful when rollups are delayed.',
        visualization: 'stacked_bar',
        metrics: this.getFunnelStepsForContentType(contentType).map((step) => step.key),
        xKey: 'date',
        yKeys: this.getFunnelStepsForContentType(contentType).map((step) => step.key),
        source: 'trackingactions',
        precision: 'exact',
        data: actionTrend,
      }),
      this.buildAnalyticsChart({
        id: 'conversion-funnel',
        title: 'Conversion Funnel',
        description: 'Unique users moving through the natural funnel for this content type.',
        visualization: 'funnel',
        metrics: ['events', 'uniqueUsers', 'rateFromPrevious'],
        valueKey: 'uniqueUsers',
        source: 'trackingactions + orders',
        precision: 'hybrid',
        data: funnelData,
      }),
      this.buildAnalyticsChart({
        id: 'action-breakdown',
        title: 'Action Breakdown',
        description: 'Tracked actions and unique users for each action.',
        visualization: 'donut',
        metrics: ['events', 'uniqueUsers'],
        valueKey: 'events',
        source: 'trackingactions',
        precision: 'exact',
        data: actionBreakdown,
      }),
      this.buildAnalyticsChart({
        id: 'content-leaderboard',
        title: 'Top Content Items',
        description: 'Best-performing items inside this content type.',
        visualization: 'table',
        metrics: [...metrics, 'completionRate', 'engagementRate'],
        source: 'analytics_daily',
        precision: 'rollup',
        data: leaderboard,
      }),
      this.buildAnalyticsChart({
        id: 'audience-devices',
        title: 'Audience Devices',
        description: 'Unique users grouped by device, OS, and browser.',
        visualization: 'bar',
        metrics: ['users'],
        xKey: 'device',
        yKeys: ['users'],
        source: 'trackingactions.metadata',
        precision: 'exact',
        data: devices,
      }),
      this.buildAnalyticsChart({
        id: 'traffic-sources',
        title: 'Traffic Sources',
        description: 'Referrer and UTM sources grouped into channels.',
        visualization: 'bar',
        metrics: ['count', 'uniqueUsers', 'share'],
        xKey: 'source',
        yKeys: ['count'],
        source: 'trackingactions.metadata',
        precision: 'exact',
        data: referrers,
      }),
      this.buildAnalyticsChart({
        id: 'activity-heatmap',
        title: 'Activity Heatmap',
        description: 'When users interact with this content type by day and hour.',
        visualization: 'heatmap',
        metrics: ['events', 'uniqueUsers'],
        xKey: 'hour',
        yKeys: ['day'],
        valueKey: 'events',
        source: 'trackingactions.timestamp',
        precision: 'exact',
        data: heatmap,
      }),
      this.buildTypeSpecificSnapshotChart(contentType, totals, actionMap, orderCharts.totals),
    ];

    if (contentType !== 'post') {
      charts.push(
        this.buildAnalyticsChart({
          id: 'revenue-trend',
          title: 'Revenue Trend',
          description: 'Paid orders and creator net revenue over time.',
          visualization: 'line',
          metrics: ['revenue', 'orders', 'uniqueBuyers'],
          xKey: 'date',
          yKeys: ['revenue', 'orders'],
          source: 'orders',
          precision: 'exact',
          unit: 'TND',
          data: orderCharts.trend,
        }),
        this.buildAnalyticsChart({
          id: 'revenue-by-content',
          title: 'Revenue by Content',
          description: 'Paid orders and revenue grouped by content item.',
          visualization: 'table',
          metrics: ['revenue', 'orders', 'uniqueBuyers'],
          source: 'orders',
          precision: 'exact',
          unit: 'TND',
          data: orderCharts.byContent,
        }),
      );
    }

    const specific = contentType === 'course'
      ? await this.getCourseSpecificCharts(creatorId, from, to, communityScope, contentMeta)
      : contentType === 'challenge'
        ? await this.getChallengeSpecificCharts(creatorId, from, to, communityScope, contentMeta)
        : { charts: [], totals: {}, sources: [] };

    charts.push(...specific.charts);

    const trackingEvents = actionBreakdown.reduce((sum: number, row: any) => sum + this.toFiniteNumber(row.events), 0);
    const uniqueUsers = Math.max(
      ...actionBreakdown.map((row: any) => this.toFiniteNumber(row.uniqueUsers)),
      this.toFiniteNumber((totals as Record<string, number>).uniqueUsers),
      0,
    );

    return {
      contentType,
      contentId: contentId || null,
      contentMeta: contentMeta
        ? {
            title: contentMeta.title,
            communityId: contentMeta.communityId,
            currency: contentMeta.currency,
            price: contentMeta.price,
            trackingIds: contentMeta.trackingIds,
            orderIds: contentMeta.orderIds,
          }
        : null,
      generatedAt: new Date().toISOString(),
      range: { from: from.toISOString(), to: to.toISOString(), timezone: 'UTC' },
      totals: { ...totals, ...specific.totals, trackingEvents, preciseUniqueUsers: uniqueUsers },
      charts,
      precision: {
        label: trackingEvents < 30 ? 'Low sample' : trackingEvents < 250 ? 'Directional' : 'Reliable',
        sources: Array.from(new Set(['analytics_daily', 'trackingactions', 'orders', ...specific.sources])),
        notes: [
          'analytics_daily powers fast time-series and leaderboards.',
          'trackingactions powers exact action, device, source, funnel, and heatmap charts.',
          contentType === 'course' ? 'courseenrollments powers enrollment and learner-progress charts.' : null,
          contentType === 'challenge' ? 'challengesubmissions powers submission status and task charts.' : null,
        ].filter(Boolean),
      },
    };
  }

  async debugCreatorStatus(creatorId: string, communityId?: string, communitySlug?: string) {
    const communityScope = await this.resolveCommunityScope(creatorId, communityId, communitySlug);
    const tracking = this.dbConnection.collection('trackingactions');
    const coursesCol = this.dbConnection.collection('cours');

    // 1. Check raw tracking actions for this creator's courses
    const trackingSummary = await tracking.aggregate([
      { $match: { contentType: 'course' } },
      {
        $lookup: {
          from: 'cours',
          localField: 'contentId',
          foreignField: 'id',
          as: 'courseInfo'
        }
      },
      { $unwind: '$courseInfo' },
      { $match: { 'courseInfo.creatorId': this.getCreatorObjectId(creatorId) } },
      ...(communityScope.hasFilter ? [{ $match: this.buildLookupCommunityMatch('courseInfo.communityId', communityScope.lookupCommunityValues) }] : []),
      {
        $group: {
          _id: { action: '$actionType', contentId: '$contentId' },
          count: { $sum: 1 },
          communityId: { $first: '$courseInfo.communityId' }
        }
      }
    ]).toArray();

    // 2. Count tracking actions for ALL content types
    const trackingByAllTypes = await tracking.aggregate([
      { $group: { _id: '$contentType', count: { $sum: 1 } } }
    ]).toArray();

    // 3. Check rollups in analytics_daily
    const match: any = { creatorId: this.getCreatorObjectId(creatorId) };
    if (communityScope.hasFilter) this.setDailyCommunityFilter(match, communityScope.communityIdStrings);

    const rollupSummary = await this.dailyModel.aggregate([
      { $match: match },
      { $group: { _id: '$contentType', count: { $sum: 1 }, totalViews: { $sum: '$views' }, totalStarts: { $sum: '$starts' } } }
    ]);

    // 4. Check course id vs _id usage for a sample course
    const sampleCourse = await coursesCol.findOne({ creatorId: new Types.ObjectId(creatorId) });

    return {
      creatorId,
      communityIdFilter: communityScope.cacheKeyPart,
      trackingSummary,
      trackingByAllTypes,
      rollupSummary,
      courseMapping: sampleCourse ? {
        mongoId: sampleCourse._id,
        customId: sampleCourse.id,
        communityId: sampleCourse.communityId
      } : 'No courses found'
    };
  }

  // ═══════════════════════════════════════════════════════════
  // Phase 3: New Analytics Endpoints
  // ═══════════════════════════════════════════════════════════

  async getRevenue(creatorId: string, from: Date, to: Date, communityId?: string, communitySlug?: string, contentType?: string, contentId?: string) {
    const { from: clampedFrom, to: clampedTo } = await this.clampDateRangeForPlan(creatorId, from, to);
    const cacheKeyStr = this.cacheKey(creatorId, clampedFrom.toISOString(), clampedTo.toISOString(), `revenue:${contentType || 'all'}:${contentId || 'all'}`);
    const cached = await this.getCache<any>(cacheKeyStr);
    if (cached) return cached;

    const creatorObjId = this.getCreatorObjectId(creatorId);
    const { communityIdStrings } = await this.resolveCommunityScope(creatorId, communityId, communitySlug);

    const match: Record<string, any> = {
      creatorId: creatorObjId,
      date: { $gte: clampedFrom, $lte: clampedTo },
      revenueAttributed: { $gt: 0 },
    };
    if (communityIdStrings.length > 0) this.setDailyCommunityFilter(match, communityIdStrings);
    if (contentType) match.contentType = contentType;
    if (contentId) match.contentId = contentId;

    const pipeline: any[] = [
      { $match: match },
      {
        $group: {
          _id: { contentType: '$contentType', contentId: '$contentId' },
          revenue: { $sum: '$revenueAttributed' },
          views: { $sum: '$views' },
          starts: { $sum: '$starts' },
          completes: { $sum: '$completes' },
          currency: { $first: '$currency' },
        },
      },
      { $sort: { revenue: -1 } },
    ];

    const byContent = await this.dailyModel.aggregate(pipeline).exec();

    const trendPipeline: any[] = [
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          revenue: { $sum: '$revenueAttributed' },
          orders: { $sum: '$completes' },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const trend = await this.dailyModel.aggregate(trendPipeline).exec();
    const totalRevenue = byContent.reduce((sum, r) => sum + (r.revenue || 0), 0);
    const totalOrders = byContent.reduce((sum, r) => sum + (r.completes || 0), 0);

    const result = {
      totalRevenue,
      currency: byContent[0]?.currency || 'TND',
      totalOrders,
      avgOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
      byContent: byContent.map((r) => ({
        contentType: r._id.contentType,
        contentId: r._id.contentId,
        revenue: r.revenue,
        views: r.views,
        starts: r.starts,
        completes: r.completes,
        revenueShare: totalRevenue > 0 ? Math.round((r.revenue / totalRevenue) * 1000) / 10 : 0,
      })),
      trend: trend.map((t) => ({ date: t._id, revenue: t.revenue, orders: t.orders })),
    };

    this.setCache(cacheKeyStr, result, 5 * 60 * 1000);
    return result;
  }

  async getGeography(creatorId: string, from: Date, to: Date, granularity: 'country' | 'city', communityId?: string, communitySlug?: string) {
    const { from: clampedFrom, to: clampedTo } = await this.clampDateRangeForPlan(creatorId, from, to);
    const cacheKeyStr = this.cacheKey(creatorId, clampedFrom.toISOString(), clampedTo.toISOString(), `geo:${granularity}`);
    const cached = await this.getCache<any>(cacheKeyStr);
    if (cached) return cached;

    const creatorObjId = this.getCreatorObjectId(creatorId);
    const { communityIdStrings } = await this.resolveCommunityScope(creatorId, communityId, communitySlug);

    const match: Record<string, any> = {
      creatorId: creatorObjId,
      date: { $gte: clampedFrom, $lte: clampedTo },
    };
    if (communityIdStrings.length > 0) this.setDailyCommunityFilter(match, communityIdStrings);

    const pipeline: any[] = [
      { $match: match },
      {
        $project: {
          countryViews: { $objectToArray: { $ifNull: ['$countryViews', {}] } },
          views: 1,
        },
      },
      { $unwind: { path: '$countryViews', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: '$countryViews.k',
          views: { $sum: '$countryViews.v' },
        },
      },
      { $sort: { views: -1 } },
    ];

    const rows = await this.dailyModel.aggregate(pipeline).exec();
    const totalViews = rows.reduce((s, r) => s + r.views, 0);

    const result = {
      granularity,
      data: rows.map((r) => ({
        code: r._id,
        name: r._id,
        views: r.views,
        share: totalViews > 0 ? Math.round((r.views / totalViews) * 1000) / 10 : 0,
      })),
    };

    this.setCache(cacheKeyStr, result, 30 * 60 * 1000);
    return result;
  }

  async getRetention(creatorId: string, from: Date, to: Date, period: 'weekly' | 'monthly', communityId?: string) {
    const { from: clampedFrom, to: clampedTo } = await this.clampDateRangeForPlan(creatorId, from, to);
    const cacheKeyStr = this.cacheKey(creatorId, clampedFrom.toISOString(), clampedTo.toISOString(), `retention:${period}`);
    const cached = await this.getCache<any>(cacheKeyStr);
    if (cached) return cached;

    const creatorObjId = this.getCreatorObjectId(creatorId);
    const match: Record<string, any> = {
      creatorId: creatorObjId,
      period,
      cohortStart: { $gte: clampedFrom, $lte: clampedTo },
    };
    if (communityId) match.communityId = communityId;

    const rows = await this.retentionModel.find(match).sort({ cohortStart: -1, week: 1 }).lean();

    const cohortMap = new Map<string, { cohortLabel: string; cohortStart: string; cohortSize: number; weeks: any[] }>();
    for (const row of rows) {
      const key = row.cohortStart.toISOString();
      if (!cohortMap.has(key)) {
        cohortMap.set(key, {
          cohortLabel: period === 'weekly' ? `Week of ${row.cohortStart.toISOString().slice(0, 10)}` : row.cohortStart.toISOString().slice(0, 7),
          cohortStart: row.cohortStart.toISOString().slice(0, 10),
          cohortSize: row.cohortSize,
          weeks: [],
        });
      }
      cohortMap.get(key)!.weeks.push({ week: row.week, retained: row.retained, rate: row.retentionRate });
    }

    const result = { cohorts: Array.from(cohortMap.values()) };
    this.setCache(cacheKeyStr, result, 60 * 60 * 1000);
    return result;
  }

  async getCompare(creatorId: string, from: Date, to: Date, compareFrom: Date, compareTo: Date, metric: string, communityId?: string, communitySlug?: string) {
    const { from: clampedFrom, to: clampedTo } = await this.clampDateRangeForPlan(creatorId, from, to);
    const creatorObjId = this.getCreatorObjectId(creatorId);
    const { communityIdStrings } = await this.resolveCommunityScope(creatorId, communityId, communitySlug);

    const aggregateForRange = async (rangeFrom: Date, rangeTo: Date) => {
      const match: Record<string, any> = {
        creatorId: creatorObjId,
        date: { $gte: rangeFrom, $lte: rangeTo },
      };
      if (communityIdStrings.length > 0) this.setDailyCommunityFilter(match, communityIdStrings);

      const metricField = `$${metric}`;
      const pipeline: any[] = [
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            value: { $sum: metricField },
          },
        },
        { $sort: { _id: 1 } },
      ];
      return this.dailyModel.aggregate(pipeline).exec();
    };

    const [currentTrend, previousTrend] = await Promise.all([
      aggregateForRange(clampedFrom, clampedTo),
      aggregateForRange(compareFrom, compareTo),
    ]);

    const currentTotal = currentTrend.reduce((s, r) => s + (r.value || 0), 0);
    const previousTotal = previousTrend.reduce((s, r) => s + (r.value || 0), 0);
    const change = previousTotal > 0 ? Math.round(((currentTotal - previousTotal) / previousTotal) * 1000) / 10 : 0;

    return {
      metric,
      current: { value: currentTotal, trend: currentTrend.map((t) => ({ date: t._id, value: t.value })) },
      previous: { value: previousTotal, trend: previousTrend.map((t) => ({ date: t._id, value: t.value })) },
      change,
      changeDirection: change >= 0 ? 'up' : 'down',
    };
  }

  async getSessionQuality(creatorId: string, sessionId: string, from: Date, to: Date) {
    const { from: clampedFrom, to: clampedTo } = await this.clampDateRangeForPlan(creatorId, from, to);
    const creatorObjId = this.getCreatorObjectId(creatorId);

    const match: Record<string, any> = {
      creatorId: creatorObjId,
      contentType: 'session',
      contentId: sessionId,
      date: { $gte: clampedFrom, $lte: clampedTo },
    };

    const pipeline: any[] = [
      { $match: match },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: '$starts' },
          showUps: { $sum: '$sessionShowUps' },
          noShows: { $sum: '$sessionNoShows' },
          rebookings: { $sum: '$sessionRebookings' },
          avgRating: { $avg: '$avgRating' },
          completes: { $sum: '$completes' },
          revenue: { $sum: '$revenueAttributed' },
        },
      },
    ];

    const [agg] = await this.dailyModel.aggregate(pipeline).exec();
    const totalBookings = agg?.totalBookings || 0;

    return {
      sessionId,
      totalBookings,
      showUpRate: totalBookings > 0 ? Math.round((agg?.showUps / totalBookings) * 1000) / 10 : 0,
      noShowRate: totalBookings > 0 ? Math.round((agg?.noShows / totalBookings) * 1000) / 10 : 0,
      rebookingRate: totalBookings > 0 ? Math.round((agg?.rebookings / totalBookings) * 1000) / 10 : 0,
      avgRating: Math.round((agg?.avgRating || 0) * 10) / 10,
      completedSessions: agg?.completes || 0,
      revenue: agg?.revenue || 0,
    };
  }

  async getChallengeStreaks(creatorId: string, challengeId: string, from: Date, to: Date) {
    const { from: clampedFrom, to: clampedTo } = await this.clampDateRangeForPlan(creatorId, from, to);
    const creatorObjId = this.getCreatorObjectId(creatorId);

    const match: Record<string, any> = {
      creatorId: creatorObjId,
      contentType: 'challenge',
      contentId: challengeId,
      date: { $gte: clampedFrom, $lte: clampedTo },
    };

    const pipeline: any[] = [
      { $match: match },
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: '$uniqueUsers' },
          totalCompletes: { $sum: '$completes' },
          totalStarts: { $sum: '$starts' },
          activeStreaks: { $max: '$activeStreaks' },
          maxStreakDays: { $max: '$maxStreakDays' },
        },
      },
    ];

    const [agg] = await this.dailyModel.aggregate(pipeline).exec();
    const participants = agg?.totalParticipants || 0;

    return {
      challengeId,
      activeChallengers: participants,
      dailyActiveRate: participants > 0 ? Math.round(((agg?.activeStreaks || 0) / participants) * 1000) / 10 : 0,
      avgStreakDays: agg?.activeStreaks ? Math.round((agg.maxStreakDays || 0) / Math.max(agg.activeStreaks, 1) * 10) / 10 : 0,
      maxStreakDays: agg?.maxStreakDays || 0,
      completionRate: agg?.totalStarts > 0 ? Math.round(((agg?.totalCompletes || 0) / agg.totalStarts) * 1000) / 10 : 0,
    };
  }

  async getLatestWeeklyReport(creatorId: string) {
    const creatorObjId = this.getCreatorObjectId(creatorId);
    return this.weeklyReportModel.findOne({ creatorId: creatorObjId }).sort({ weekStart: -1 }).lean();
  }

}
