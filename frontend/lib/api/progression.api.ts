import { apiClient } from './client';
import type {
  ProgressionContentType,
  ProgressionOverview,
} from './types';

export interface ProgressionOverviewParams {
  communityId?: string;
  communitySlug?: string;
  contentTypes?: ProgressionContentType[];
  page?: number;
  limit?: number;
}

const buildQueryParams = (params?: ProgressionOverviewParams) => {
  if (!params) return undefined;

  const query: Record<string, string | number> = {};

  if (params.communityId) {
    query.communityId = params.communityId;
  }

  if (!params.communityId && params.communitySlug) {
    const normalisedSlug = decodeURIComponent(params.communitySlug).trim();
    if (normalisedSlug) {
      query.communitySlug = normalisedSlug;
    }
  }

  if (params.contentTypes?.length) {
    query.contentTypes = params.contentTypes.join(',');
  }

  if (typeof params.page === 'number') {
    query.page = params.page;
  }

  if (typeof params.limit === 'number') {
    query.limit = params.limit;
  }

  return query;
};

export const progressionApi = {
  /**
   * Fetch aggregated progression for the current user.
   * Pass either `communityId` or `communitySlug` to scope results
   * to a specific community.
   */
  async getOverview(
    params?: ProgressionOverviewParams,
  ): Promise<ProgressionOverview> {
    const res = await apiClient.get<{ success: boolean; message?: string; data: ProgressionOverview }>(
      '/progression/overview',
      buildQueryParams(params),
    );
    return res.data;
  },
};

