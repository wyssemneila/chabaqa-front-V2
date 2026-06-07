'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  creatorAnalyticsApi,
  type CreatorAnalyticsParams,
  type CreatorContentChartType,
} from '@/lib/api/creator-analytics.api';

function buildDateParams(timeRange: string): { from: string; to: string } {
  const to = new Date().toISOString().slice(0, 10);
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
  const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  return { from, to };
}

export function useAnalyticsOverview(timeRange: string, communityId?: string) {
  const params = { ...buildDateParams(timeRange), communityId };
  return useQuery({
    queryKey: ['analytics', 'overview', timeRange, communityId],
    queryFn: () => creatorAnalyticsApi.getOverview(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAnalyticsCourses(timeRange: string, communityId?: string) {
  const params = { ...buildDateParams(timeRange), communityId };
  return useQuery({
    queryKey: ['analytics', 'courses', timeRange, communityId],
    queryFn: () => creatorAnalyticsApi.getCourses(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsChallenges(timeRange: string, communityId?: string) {
  const params = { ...buildDateParams(timeRange), communityId };
  return useQuery({
    queryKey: ['analytics', 'challenges', timeRange, communityId],
    queryFn: () => creatorAnalyticsApi.getChallenges(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsSessions(timeRange: string, communityId?: string) {
  const params = { ...buildDateParams(timeRange), communityId };
  return useQuery({
    queryKey: ['analytics', 'sessions', timeRange, communityId],
    queryFn: () => creatorAnalyticsApi.getSessions(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsEvents(timeRange: string, communityId?: string) {
  const params = { ...buildDateParams(timeRange), communityId };
  return useQuery({
    queryKey: ['analytics', 'events', timeRange, communityId],
    queryFn: () => creatorAnalyticsApi.getEvents(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsProducts(timeRange: string, communityId?: string) {
  const params = { ...buildDateParams(timeRange), communityId };
  return useQuery({
    queryKey: ['analytics', 'products', timeRange, communityId],
    queryFn: () => creatorAnalyticsApi.getProducts(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsPosts(timeRange: string, communityId?: string) {
  const params = { ...buildDateParams(timeRange), communityId };
  return useQuery({
    queryKey: ['analytics', 'posts', timeRange, communityId],
    queryFn: () => creatorAnalyticsApi.getPosts(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsDevices(timeRange: string, communityId?: string) {
  const params = { ...buildDateParams(timeRange), communityId };
  return useQuery({
    queryKey: ['analytics', 'devices', timeRange, communityId],
    queryFn: () => creatorAnalyticsApi.getDevices(params),
    staleTime: 15 * 60 * 1000,
  });
}

export function useAnalyticsReferrers(timeRange: string, communityId?: string) {
  const params = { ...buildDateParams(timeRange), communityId };
  return useQuery({
    queryKey: ['analytics', 'referrers', timeRange, communityId],
    queryFn: () => creatorAnalyticsApi.getReferrers(params),
    staleTime: 15 * 60 * 1000,
  });
}

export function useAnalyticsContentCharts(
  timeRange: string,
  contentType: CreatorContentChartType | 'all' = 'all',
  communityId?: string,
  contentId?: string,
  enabled = true,
) {
  const params = {
    ...buildDateParams(timeRange),
    communityId,
    contentType,
    contentId,
  };

  return useQuery({
    queryKey: ['analytics', 'content-charts', timeRange, contentType, communityId, contentId],
    queryFn: () => creatorAnalyticsApi.getContentCharts(params),
    staleTime: 2 * 60 * 1000,
    enabled,
  });
}

export function useAnalyticsRevenue(timeRange: string, communityId?: string, enabled = true) {
  const params = { ...buildDateParams(timeRange), communityId };
  return useQuery({
    queryKey: ['analytics', 'revenue', timeRange, communityId],
    queryFn: () => creatorAnalyticsApi.getRevenue(params),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useAnalyticsGeography(timeRange: string, granularity: 'country' | 'city' = 'country', communityId?: string, enabled = true) {
  const params = { ...buildDateParams(timeRange), communityId, granularity };
  return useQuery({
    queryKey: ['analytics', 'geography', timeRange, granularity, communityId],
    queryFn: () => creatorAnalyticsApi.getGeography(params),
    staleTime: 30 * 60 * 1000,
    enabled,
  });
}

export function useAnalyticsRetention(timeRange: string, period: 'weekly' | 'monthly' = 'weekly', communityId?: string, enabled = true) {
  const params = { ...buildDateParams(timeRange), communityId, period };
  return useQuery({
    queryKey: ['analytics', 'retention', timeRange, period, communityId],
    queryFn: () => creatorAnalyticsApi.getRetention(params),
    staleTime: 60 * 60 * 1000,
    enabled,
  });
}

export function useAnalyticsCompare(
  timeRange: string,
  metric: string,
  communityId?: string,
  enabled = true
) {
  const { from, to } = buildDateParams(timeRange);
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
  const compareFrom = new Date(new Date(from).getTime() - days * 86400000).toISOString().slice(0, 10);
  const compareTo = new Date(new Date(from).getTime() - 86400000).toISOString().slice(0, 10);
  return useQuery({
    queryKey: ['analytics', 'compare', timeRange, metric, communityId],
    queryFn: () => creatorAnalyticsApi.getCompare({ from, to, compareFrom, compareTo, metric, communityId }),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useAnalyticsFunnel(contentType: string, contentId: string, timeRange: string, communityId?: string, enabled = true) {
  const params = { ...buildDateParams(timeRange), communityId, contentType: contentType as any, contentId };
  return useQuery({
    queryKey: ['analytics', 'funnel', contentType, contentId, timeRange, communityId],
    queryFn: () => creatorAnalyticsApi.getFunnel(params),
    staleTime: 10 * 60 * 1000,
    enabled,
  });
}

export function useAnalyticsCourseChaptersFunnel(courseId: string, timeRange: string, communityId?: string, enabled = true) {
  const params = { ...buildDateParams(timeRange), communityId };
  return useQuery({
    queryKey: ['analytics', 'course-chapters-funnel', courseId, timeRange, communityId],
    queryFn: () => creatorAnalyticsApi.getCourseChaptersFunnel(courseId, params),
    staleTime: 10 * 60 * 1000,
    enabled,
  });
}

export function useAnalyticsCourseDetail(courseId: string, timeRange: string, enabled = true) {
  const params = buildDateParams(timeRange);
  return useQuery({
    queryKey: ['analytics', 'course-detail', courseId, timeRange],
    queryFn: () => creatorAnalyticsApi.getCourseAnalytics(courseId, params),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useAnalyticsSessionQuality(sessionId: string, timeRange: string, enabled = true) {
  const params = buildDateParams(timeRange);
  return useQuery({
    queryKey: ['analytics', 'session-quality', sessionId, timeRange],
    queryFn: () => creatorAnalyticsApi.getSessionQuality(sessionId, params),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useAnalyticsChallengeStreaks(challengeId: string, timeRange: string, enabled = true) {
  const params = buildDateParams(timeRange);
  return useQuery({
    queryKey: ['analytics', 'challenge-streaks', challengeId, timeRange],
    queryFn: () => creatorAnalyticsApi.getChallengeStreaks(challengeId, params),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useAnalyticsWeeklyReport(enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'weekly-report'],
    queryFn: () => creatorAnalyticsApi.getWeeklyReport(),
    staleTime: 60 * 60 * 1000,
    enabled,
  });
}

export function useAnalyticsInsights() {
  return useMutation({
    mutationFn: (payload: Parameters<typeof creatorAnalyticsApi.generateInsights>[0]) =>
      creatorAnalyticsApi.generateInsights(payload),
  });
}

export function useAnalyticsExportCsv() {
  return useMutation({
    mutationFn: (params: Parameters<typeof creatorAnalyticsApi.exportCsv>[0]) =>
      creatorAnalyticsApi.exportCsv(params),
  });
}
