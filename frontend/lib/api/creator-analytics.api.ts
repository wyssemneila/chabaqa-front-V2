import { apiClient, ApiSuccessResponse } from './client';

export interface CreatorAnalyticsParams {
  from?: string;
  to?: string;
  communityId?: string;
  communitySlug?: string;
}

export type CreatorAnalyticsExportScope =
  | 'overview'
  | 'courses'
  | 'challenges'
  | 'sessions'
  | 'events'
  | 'products'
  | 'posts';

export type CreatorFunnelContentType =
  | 'course'
  | 'challenge'
  | 'session'
  | 'event'
  | 'product'
  | 'post'
  | 'community';

export interface CreatorFunnelStep {
  stepKey: string;
  stepLabel: string;
  uniqueUsers: number | null;
  events: number;
  rateFromPrev: number | null;
}

export interface CreatorFunnelDropOffSummary {
  worstStep: { stepKey: string; stepLabel: string; dropOffRate?: number; uniqueUsers?: number | null } | null;
  dropOffRate?: number;
  sampleSizeWarnings?: string[];
}

export interface CreatorFunnelResponse {
  contentMeta: {
    title?: string;
    communityId?: string;
    currency?: string;
    price?: number;
    trackingIds?: string[];
    orderIds?: string[];
  };
  funnel: CreatorFunnelStep[];
  dropOff: CreatorFunnelDropOffSummary;
  warnings?: string[];
}

export interface CreatorCourseChapterFunnelItem {
  stepId: string;
  stepTitle: string;
  sectionId: string;
  order: number;
  uniqueStarts: number;
  uniqueCompletes: number;
  completionRate: number;
  dropOffRate: number;
  isPreview?: boolean;
  isPaidChapter?: boolean;
}

export interface CreatorCourseChaptersFunnelResponse {
  contentMeta: {
    courseId: string;
    courseTitle: string;
    communityId?: string;
    totalChapters: number;
  };
  items: CreatorCourseChapterFunnelItem[];
  dropOff: { worstStep: { stepId: string; stepTitle: string; dropOffRate: number; uniqueStarts: number; uniqueCompletes: number } | null };
  warnings?: string[];
}

export interface CreatorChallengeTaskFunnelItem {
  stepId: string;
  stepTitle: string;
  order: number;
  uniqueStarts: number;
  uniqueCompletes: number;
  completionRate: number;
  dropOffRate: number;
}

export interface CreatorChallengeTasksFunnelResponse {
  contentMeta: {
    challengeId: string;
    challengeTitle: string;
    communityId?: string;
    totalTasks: number;
  };
  items: CreatorChallengeTaskFunnelItem[];
  dropOff: { worstStep: { stepId: string; stepTitle: string; dropOffRate: number; uniqueStarts: number; uniqueCompletes: number } | null };
  warnings?: string[];
}

export type CreatorInsightsConfidence = 'low' | 'med' | 'high';

export interface CreatorInsightsResponse {
  summary: string;
  topIssues: Array<{
    stepId: string;
    stepTitle: string;
    metricEvidence: string[];
    hypothesis: string;
    confidence: CreatorInsightsConfidence;
  }>;
  fixes: Array<{
    title: string;
    whyItHelps: string;
    exactCreatorAction: string;
    expectedMetricLift: string;
    risk: string;
  }>;
  rewriteSuggestions: Array<{
    target: 'intro' | 'cta' | 'structure';
    stepId: string;
    text: string;
  }>;
  experiments: Array<{
    name: string;
    variantA: string;
    variantB: string;
    successMetric: string;
    runForDays: number;
  }>;
  warnings: string[];
}

export interface CreatorAnalyticsExportParams extends CreatorAnalyticsParams {
  scope: CreatorAnalyticsExportScope;
}

export interface TunisianBankCredentials {
  rib: string;
  bankName: string;
  ownerName: string;
}

export interface BankCredentialsResponse {
  isConfigured: boolean;
  bankDetails: TunisianBankCredentials | null;
}

export interface CourseAnalyticsRange {
  from: string;
  to: string;
}

export interface CourseAnalyticsKpis {
  enrollments: number;
  revenue: number;
  views: number;
  starts: number;
  completes: number;
  completionRate: number;
  avgWatchTimeSeconds: number;
  totalWatchTimeSeconds: number;
}

export interface CourseAnalyticsRates {
  viewsToEnrollmentRate: number;
  dropOffRate: number;
  engagementScore: number;
}

export interface CourseAnalyticsDailyTrend {
  date: string;
  views: number;
  starts: number;
  completes: number;
  watchTimeSeconds: number;
}

export interface CourseAnalyticsMeta {
  completionSource: 'progression';
  timezone: string;
  currency: string;
}

export interface CourseAnalyticsResponse {
  courseId: string;
  courseTitle: string;
  range: CourseAnalyticsRange;
  kpis: CourseAnalyticsKpis;
  rates: CourseAnalyticsRates;
  dailyTrend: CourseAnalyticsDailyTrend[];
  meta: CourseAnalyticsMeta;
}


// ═══════════════════════════════════════════════════════
// Phase 3: New Response Types
// ═══════════════════════════════════════════════════════

export interface RevenueByContentItem {
  contentType: string;
  contentId: string;
  revenue: number;
  views: number;
  starts: number;
  completes: number;
  revenueShare: number;
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface RevenueResponse {
  totalRevenue: number;
  currency: string;
  totalOrders: number;
  avgOrderValue: number;
  byContent: RevenueByContentItem[];
  trend: RevenueTrendPoint[];
}

export interface GeographyItem {
  code: string;
  name: string;
  views: number;
  share: number;
}

export interface GeographyResponse {
  granularity: 'country' | 'city';
  data: GeographyItem[];
}

export interface RetentionWeek {
  week: number;
  retained: number;
  rate: number;
}

export interface RetentionCohort {
  cohortLabel: string;
  cohortStart: string;
  cohortSize: number;
  weeks: RetentionWeek[];
}

export interface RetentionResponse {
  cohorts: RetentionCohort[];
}

export interface CompareTrendPoint {
  date: string;
  value: number;
}

export interface CompareResponse {
  metric: string;
  current: { value: number; trend: CompareTrendPoint[] };
  previous: { value: number; trend: CompareTrendPoint[] };
  change: number;
  changeDirection: 'up' | 'down';
}

export interface SessionQualityResponse {
  sessionId: string;
  totalBookings: number;
  showUpRate: number;
  noShowRate: number;
  rebookingRate: number;
  avgRating: number;
  completedSessions: number;
  revenue: number;
}

export interface ChallengeStreaksResponse {
  challengeId: string;
  activeChallengers: number;
  dailyActiveRate: number;
  avgStreakDays: number;
  maxStreakDays: number;
  completionRate: number;
}

export interface WeeklyReportHighlight {
  metric: string;
  value: number;
  change: number;
}

export interface WeeklyReportResponse {
  creatorId: string;
  weekStart: string;
  plan: string;
  summary: string;
  topIssues: Array<{ stepId: string; stepTitle: string; metricEvidence: string[]; hypothesis: string }>;
  fixes: Array<{ title: string; whyItHelps: string; exactCreatorAction: string }>;
  highlights: WeeklyReportHighlight[];
  deliveredAt?: string;
}

export type CreatorContentChartType = 'course' | 'challenge' | 'session' | 'event' | 'product' | 'post';

export type CreatorAnalyticsChartVisualization =
  | 'line'
  | 'area'
  | 'bar'
  | 'stacked_bar'
  | 'donut'
  | 'funnel'
  | 'heatmap'
  | 'table';

export interface CreatorAnalyticsChart {
  id: string;
  title: string;
  description: string;
  visualization: CreatorAnalyticsChartVisualization;
  metrics: string[];
  data: Array<Record<string, any>>;
  xKey?: string;
  yKeys?: string[];
  valueKey?: string;
  source: string;
  precision: 'exact' | 'rollup' | 'hybrid' | 'derived';
  unit?: string;
}

export interface CreatorContentChartPack {
  contentType: CreatorContentChartType;
  contentId?: string | null;
  contentMeta?: {
    title?: string;
    communityId?: string;
    currency?: string;
    price?: number;
    trackingIds?: string[];
    orderIds?: string[];
  } | null;
  generatedAt: string;
  range: {
    from: string;
    to: string;
    timezone?: string;
    lookbackDays?: number;
  };
  totals: Record<string, number>;
  charts: CreatorAnalyticsChart[];
  precision: {
    label: string;
    sources: string[];
    notes: string[];
  };
}

export interface CreatorContentChartsResponse {
  generatedAt: string;
  range: {
    from: string;
    to: string;
    timezone?: string;
    lookbackDays?: number;
  };
  community?: {
    scoped: boolean;
    id: string | null;
  };
  byContentType: Partial<Record<CreatorContentChartType, CreatorContentChartPack>>;
}

export interface CreatorContentChartsParams extends CreatorAnalyticsParams {
  contentType?: CreatorContentChartType | 'all';
  contentId?: string;
}

export type CreatorDashboardContentType =
  | 'all'
  | CreatorContentChartType
  | 'courses'
  | 'challenges'
  | 'sessions'
  | 'events'
  | 'products'
  | 'posts';

export interface CreatorDashboardAnalyticsParams extends CreatorAnalyticsParams {
  contentType?: CreatorDashboardContentType;
}

export interface CreatorDashboardKpi {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  change: number;
  sub: string;
  color: string;
  iconKey: string;
}

export interface CreatorDashboardAnalyticsResponse {
  generatedAt: string;
  range: { from: string; to: string; timezone?: string };
  filters: { communityId: string | null; communitySlug: string | null; contentType: string };
  currency: string;
  kpis: CreatorDashboardKpi[];
  timeSeries: {
    labels: string[];
    revenue: number[];
    members: number[];
    enrollments: number[];
    interactions: number[];
    views: number[];
    completions: number[];
  };
  revenueByType: Array<{ label: string; type: string; value: number; color: string }>;
  memberSources: Array<{ label: string; channel: string; value: number; count: number; color: string }>;
  communityHealth: Array<{ id: string; label: string; value: string; rawValue: number; sub: string; color: string; iconKey: string }>;
  contentPerformance: Array<{
    id: string;
    title: string;
    type: CreatorContentChartType;
    enrollments: number;
    interactions?: number;
    revenue: number;
    rating: number;
    views: number;
    completionRate: number;
    engagementRate: number;
  }>;
  devices: { rows: any[]; details: any[] };
  meta: { precisionLabel: string; sources: string[]; notes: string[] };
}

export const creatorAnalyticsApi = {
  getDashboard: async (params?: CreatorDashboardAnalyticsParams): Promise<ApiSuccessResponse<CreatorDashboardAnalyticsResponse>> => {
    return apiClient.get<ApiSuccessResponse<CreatorDashboardAnalyticsResponse>>('/analytics/creator/dashboard', params);
  },
  getOverview: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/analytics/creator/overview', params);
  },
  getCourses: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/analytics/creator/courses', params);
  },
  getChallenges: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/analytics/creator/challenges', params);
  },
  getSessions: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/analytics/creator/sessions', params);
  },
  getEvents: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/analytics/creator/events', params);
  },
  getProducts: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/analytics/creator/products', params);
  },
  getPosts: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/analytics/creator/posts', params);
  },
  getDevices: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/analytics/creator/devices', params);
  },
  getReferrers: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/analytics/creator/referrers', params);
  },
  getContentCharts: async (
    params?: CreatorContentChartsParams,
  ): Promise<ApiSuccessResponse<CreatorContentChartsResponse | CreatorContentChartPack>> => {
    return apiClient.get<ApiSuccessResponse<CreatorContentChartsResponse | CreatorContentChartPack>>('/analytics/creator/content-charts', params);
  },
  backfill: async (days: number = 90): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(`/analytics/creator/backfill?days=${days}`, {});
  },
  getCourseAnalytics: async (
    courseId: string,
    params?: { from?: string; to?: string },
  ): Promise<ApiSuccessResponse<CourseAnalyticsResponse>> => {
    return apiClient.get<ApiSuccessResponse<CourseAnalyticsResponse>>(`/analytics/creator/course/${courseId}`, params);
  },
  exportCsv: async (params: CreatorAnalyticsExportParams): Promise<ApiSuccessResponse<{ filename: string; csv: string }>> => {
    return apiClient.get<ApiSuccessResponse<{ filename: string; csv: string }>>('/analytics/creator/export', params);
  },

  // Funnels + AI insights
  getFunnel: async (params: CreatorAnalyticsParams & { contentType: CreatorFunnelContentType; contentId: string }): Promise<ApiSuccessResponse<CreatorFunnelResponse>> => {
    return apiClient.get<ApiSuccessResponse<CreatorFunnelResponse>>('/analytics/creator/funnel', params);
  },
  getCourseChaptersFunnel: async (
    courseId: string,
    params: CreatorAnalyticsParams,
  ): Promise<ApiSuccessResponse<CreatorCourseChaptersFunnelResponse>> => {
    return apiClient.get<ApiSuccessResponse<CreatorCourseChaptersFunnelResponse>>(`/analytics/creator/course/${courseId}/chapters/funnel`, params);
  },
  getChallengeTasksFunnel: async (
    challengeId: string,
    params: CreatorAnalyticsParams,
  ): Promise<ApiSuccessResponse<CreatorChallengeTasksFunnelResponse>> => {
    return apiClient.get<ApiSuccessResponse<CreatorChallengeTasksFunnelResponse>>(`/analytics/creator/challenge/${challengeId}/tasks/funnel`, params);
  },
  generateInsights: async (payload: {
    contentType: CreatorFunnelContentType;
    contentId: string;
    from: string;
    to: string;
    communityId?: string;
    communitySlug?: string;
    focusStepId?: string;
  }): Promise<ApiSuccessResponse<{ success: true; data: CreatorInsightsResponse; cached: boolean; model?: string }>> => {
    return apiClient.post<ApiSuccessResponse<{ success: true; data: CreatorInsightsResponse; cached: boolean; model?: string }>>('/analytics/creator/insights', payload);
  },

  // Payouts
  getPayouts: async (params?: any): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/payouts', params);
  },
  getPayoutStats: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/payouts/stats', params);
  },
  getAvailableBalance: async (params?: CreatorAnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/payouts/available-balance', params);
  },
  requestPayout: async (payload: any): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>('/payouts', payload);
  },
  cancelPayout: async (id: string, reason?: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(`/payouts/${id}/cancel`, { reason });
  },
  getBankCredentials: async (): Promise<BankCredentialsResponse> => {
    return apiClient.get<BankCredentialsResponse>('/payouts/bank-credentials');
  },
  updateBankCredentials: async (payload: TunisianBankCredentials): Promise<BankCredentialsResponse> => {
    return apiClient.put<BankCredentialsResponse>('/payouts/bank-credentials', payload);
  },

  // ═══════════════════════════════════════════════
  // Phase 3: New API Methods
  // ═══════════════════════════════════════════════

  getRevenue: async (params?: CreatorAnalyticsParams & { contentType?: string; contentId?: string }): Promise<ApiSuccessResponse<RevenueResponse>> => {
    return apiClient.get<ApiSuccessResponse<RevenueResponse>>('/analytics/creator/revenue', params);
  },
  getGeography: async (params?: CreatorAnalyticsParams & { granularity?: 'country' | 'city' }): Promise<ApiSuccessResponse<GeographyResponse>> => {
    return apiClient.get<ApiSuccessResponse<GeographyResponse>>('/analytics/creator/geography', params);
  },
  getRetention: async (params?: CreatorAnalyticsParams & { period?: 'weekly' | 'monthly' }): Promise<ApiSuccessResponse<RetentionResponse>> => {
    return apiClient.get<ApiSuccessResponse<RetentionResponse>>('/analytics/creator/retention', params);
  },
  getCompare: async (params: CreatorAnalyticsParams & { compareFrom: string; compareTo: string; metric: string }): Promise<ApiSuccessResponse<CompareResponse>> => {
    return apiClient.get<ApiSuccessResponse<CompareResponse>>('/analytics/creator/compare', params);
  },
  getSessionQuality: async (sessionId: string, params?: { from?: string; to?: string }): Promise<ApiSuccessResponse<SessionQualityResponse>> => {
    return apiClient.get<ApiSuccessResponse<SessionQualityResponse>>(`/analytics/creator/sessions/${sessionId}/quality`, params);
  },
  getChallengeStreaks: async (challengeId: string, params?: { from?: string; to?: string }): Promise<ApiSuccessResponse<ChallengeStreaksResponse>> => {
    return apiClient.get<ApiSuccessResponse<ChallengeStreaksResponse>>(`/analytics/creator/challenges/${challengeId}/streaks`, params);
  },
  getWeeklyReport: async (): Promise<ApiSuccessResponse<WeeklyReportResponse | null>> => {
    return apiClient.get<ApiSuccessResponse<WeeklyReportResponse | null>>('/analytics/creator/weekly-report');
  },
};
