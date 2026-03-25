import { apiClient, ApiSuccessResponse, PaginatedResponse, PaginationParams } from './client';
import type { ApiGetOptions } from './client';
import type {
  Community,
  CommunitySettings,
  CommunityMember,
  CommunityFilters,
  InvitePreview,
} from './types';

const isRouteNotFound = (error: any): boolean => {
  const statusCode = Number(error?.statusCode ?? error?.status ?? 0);
  const code = String(error?.code || error?.error?.code || "").toUpperCase();
  const message =
    typeof error?.message === "string"
      ? error.message
      : typeof error?.message?.message === "string"
        ? error.message.message
        : typeof error?.error?.message === "string"
          ? error.error.message
          : "";
  return (
    statusCode === 404 ||
    code === "NOT_FOUND" ||
    /cannot\s+(get|patch|put)\s+/i.test(message)
  );
};

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const getClientApiBase = () =>
  (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

const getBrowserAuthHeader = (): string | null => {
  if (typeof window === 'undefined') return null;

  const rawLocalToken =
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token');

  if (!rawLocalToken) return null;
  return rawLocalToken.toLowerCase().startsWith('bearer ')
    ? rawLocalToken
    : `Bearer ${rawLocalToken}`;
};

const parseJsonSafely = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text().catch(() => '');
    return text ? { message: text } : null;
  }

  return response.json().catch(() => null);
};

const normalizeCommunityMetrics = (community: any) => {
  if (!community || typeof community !== "object") {
    return community;
  }

  const rawMembers = community.members;
  const membersCount = asNumber(community.membersCount, 0);
  const derivedMembers =
    typeof rawMembers === "number"
      ? rawMembers
      : Array.isArray(rawMembers)
        ? rawMembers.length
        : typeof rawMembers === "object" && rawMembers !== null
          ? asNumber((rawMembers as any).count, 0)
          : 0;
  const normalizedMembers = Math.max(membersCount, derivedMembers, 0);
  const rating = asNumber(community.averageRating ?? community.rating, 0);
  const ratingCount = asNumber(community.ratingCount, 0);
  const verified = Boolean(community.verified ?? community.isVerified ?? false);
  const isActive =
    typeof community.isActive === "boolean"
      ? community.isActive
      : typeof community.status === "string"
        ? community.status !== "inactive"
        : true;

  return {
    ...community,
    members: normalizedMembers,
    membersCount: normalizedMembers,
    rating,
    averageRating: rating,
    ratingCount,
    verified,
    isVerified: verified,
    isActive,
  };
};

export interface GetCommunitiesParams extends PaginationParams {
  category?: string;
  featured?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateCommunityData {
  // Required fields
  name: string;
  country: string;
  status: 'public' | 'private';
  joinFee: 'free' | 'paid';
  feeAmount: string;
  currency: 'USD' | 'TND' | 'EUR';
  socialLinks: {
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    youtube?: string;
    linkedin?: string;
    website?: string;
    twitter?: string;
    discord?: string;
    behance?: string;
    github?: string;
  };

  // Optional fields
  bio?: string; // Backend uses 'bio', not 'description'
  slug?: string;
  longDescription?: string;
  category?: string;
  tags?: string[];
  image?: string;
  logo?: string;
  coverImage?: string;
}

export interface UpdateCommunityData
  extends Partial<
    Omit<CreateCommunityData, "currency"> & {
      currency: string;
      description: string;
      price: number;
      priceType: "free" | "one-time" | "monthly" | "yearly";
      type: "community" | "course" | "challenge" | "event" | "oneToOne" | "product";
      settings: CommunitySettings;
    }
  > {}

export interface UpdateCommunitySettingsData extends Partial<Omit<CommunitySettings, 'id' | 'communityId' | 'updatedAt'>> { }

export interface JoinCommunityInput {
  communityId?: string;
  inviteCode?: string;
  message?: string;
}

export interface CommunityManualPaymentInput {
  communityId: string;
  proof: File;
  inviteCode?: string;
  promoCode?: string;
}

export interface CreateCommunityResponse extends ApiSuccessResponse<Community> {
  accessToken?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}


export const communitiesApi = {
  
  getAll: async (
    params?: GetCommunitiesParams,
    options?: ApiGetOptions,
  ): Promise<PaginatedResponse<Community>> => {
    const response = await apiClient.get<any>(
      '/community-aff-crea-join/all-communities',
      params,
      options,
    );

    if (Array.isArray(response?.data)) {
      return {
        ...response,
        data: response.data.map((community: any) => normalizeCommunityMetrics(community)),
      } as PaginatedResponse<Community>;
    }

    if (Array.isArray(response?.data?.communities)) {
      return {
        ...response,
        data: {
          ...response.data,
          communities: response.data.communities.map((community: any) =>
            normalizeCommunityMetrics(community),
          ),
        },
      } as PaginatedResponse<Community>;
    }

    return response as PaginatedResponse<Community>;
  },

  // Create community
  create: async (data: CreateCommunityData): Promise<CreateCommunityResponse> => {
    const payload: any = { ...(data as any) };
    delete payload.inviteCode;
    delete payload.inviteLink;
    return apiClient.post<CreateCommunityResponse>('/community-aff-crea-join/create', payload);
  },

  // Get community by ID
  getById: async (id: string): Promise<ApiSuccessResponse<Community>> => {
    try {
      const response = await apiClient.get<ApiSuccessResponse<Community>>(`/community-aff-crea-join/${id}`);
      return {
        ...response,
        data: normalizeCommunityMetrics(response.data),
      };
    } catch (error) {
      if (!isRouteNotFound(error)) {
        throw error;
      }
      const response = await apiClient.get<ApiSuccessResponse<Community>>(`/communities/${id}`);
      return {
        ...response,
        data: normalizeCommunityMetrics(response.data),
      };
    }
  },

  // Get community by slug or ID
  getBySlug: async (slug: string): Promise<ApiSuccessResponse<Community>> => {
    try {
      const response = await apiClient.get<ApiSuccessResponse<Community>>(`/community-aff-crea-join/${slug}`);
      return {
        ...response,
        data: normalizeCommunityMetrics(response.data),
      };
    } catch (error) {
      if (!isRouteNotFound(error)) {
        throw error;
      }
      const response = await apiClient.get<ApiSuccessResponse<Community>>(`/communities/${slug}`);
      return {
        ...response,
        data: normalizeCommunityMetrics(response.data),
      };
    }
  },

  validateInvite: async (inviteCode: string): Promise<ApiSuccessResponse<InvitePreview>> => {
    return apiClient.get<ApiSuccessResponse<InvitePreview>>(
      `/community-aff-crea-join/validate-invite/${encodeURIComponent(inviteCode)}`,
    );
  },

  join: async (
    input: JoinCommunityInput,
  ): Promise<ApiSuccessResponse<Community | null>> => {
    const communityId = typeof input?.communityId === 'string' ? input.communityId.trim() : '';
    const inviteCode = typeof input?.inviteCode === 'string' ? input.inviteCode.trim() : '';
    const message = typeof input?.message === 'string' ? input.message : undefined;

    if (!communityId && !inviteCode) {
      throw new Error('communityId or inviteCode is required');
    }

    const endpoint = inviteCode
      ? '/community-aff-crea-join/join-by-invite'
      : '/community-aff-crea-join/join';
    const payload = inviteCode
      ? { inviteCode, message }
      : { communityId, message };

    try {
      return await apiClient.post<ApiSuccessResponse<Community>>(endpoint, payload);
    } catch (error: any) {
      const statusCode = Number(error?.statusCode ?? error?.status ?? 0);
      if (statusCode === 409) {
        return {
          success: true,
          message: error?.message || 'Already a member of this community',
          data: null,
        };
      }

      throw error;
    }
  },

  joinByInvite: async (inviteCode: string): Promise<ApiSuccessResponse<Community>> => {
    return apiClient.post<ApiSuccessResponse<Community>>('/community-aff-crea-join/join-by-invite', {
      inviteCode,
    });
  },

  leaveCommunity: async (
    communityId: string,
  ): Promise<{ success: boolean; message?: string }> => {
    return apiClient.post<{ success: boolean; message?: string }>(
      `/community-aff-crea-join/leave/${encodeURIComponent(communityId)}`,
    );
  },

  // Update community with method/route fallback for backward-compatible backend deployments
  update: async (
    idOrSlug: string,
    data: UpdateCommunityData,
    fallbackIdOrSlug?: string,
  ): Promise<ApiSuccessResponse<Community>> => {
    const identifiers = Array.from(
      new Set(
        [idOrSlug, fallbackIdOrSlug]
          .map((value) => String(value || "").trim())
          .filter(Boolean),
      ),
    );

    const attempts = identifiers.flatMap((identifier) => [
      { method: "patch" as const, endpoint: `/community-aff-crea-join/${encodeURIComponent(identifier)}` },
      { method: "put" as const, endpoint: `/community-aff-crea-join/${encodeURIComponent(identifier)}` },
      { method: "patch" as const, endpoint: `/community-aff-crea-join/update/${encodeURIComponent(identifier)}` },
      { method: "put" as const, endpoint: `/community-aff-crea-join/update/${encodeURIComponent(identifier)}` },
    ]);

    let lastError: any = null;

    for (const attempt of attempts) {
      try {
        if (attempt.method === "patch") {
          return await apiClient.patch<ApiSuccessResponse<Community>>(attempt.endpoint, data);
        }
        return await apiClient.put<ApiSuccessResponse<Community>>(attempt.endpoint, data);
      } catch (error) {
        lastError = error;
        if (!isRouteNotFound(error)) {
          throw error;
        }
      }
    }

    throw lastError || new Error("Failed to update community");
  },

  // Delete community
  delete: async (id: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.delete<ApiSuccessResponse<void>>(`/community-aff-crea-join/${id}`);
  },

  // Get community members
  getMembers: async (id: string, params?: PaginationParams): Promise<PaginatedResponse<CommunityMember>> => {
    return apiClient.get<PaginatedResponse<CommunityMember>>(`/community-aff-crea-join/${id}/members`, params);
  },

  // Add member to community
  addMember: async (id: string, userId: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.post<ApiSuccessResponse<void>>(`/community-aff-crea-join/join`, { userId });
  },

  // Get community settings
  getSettings: async (id: string): Promise<ApiSuccessResponse<CommunitySettings>> => {
    return apiClient.get<ApiSuccessResponse<CommunitySettings>>(`/community-aff-crea-join/${id}/settings`);
  },

  // Update community settings
  updateSettings: async (id: string, settings: UpdateCommunitySettingsData): Promise<ApiSuccessResponse<CommunitySettings>> => {
    const identifier = encodeURIComponent(id);
    const attempts = [
      { method: "patch" as const, endpoint: `/community-aff-crea-join/${identifier}/settings` },
      { method: "put" as const, endpoint: `/community-aff-crea-join/${identifier}/settings` },
    ];

    let lastError: any = null;
    for (const attempt of attempts) {
      try {
        if (attempt.method === "patch") {
          return await apiClient.patch<ApiSuccessResponse<CommunitySettings>>(attempt.endpoint, settings);
        }
        return await apiClient.put<ApiSuccessResponse<CommunitySettings>>(attempt.endpoint, settings);
      } catch (error) {
        lastError = error;
        if (!isRouteNotFound(error)) {
          throw error;
        }
      }
    }

    throw lastError || new Error("Failed to update community settings");
  },

  // Get community stats
  getStats: async (id: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/community-aff-crea-join/${id}/stats`);
  },

  // Get communities created by the authenticated user (creator)
  getMyCreated: async (): Promise<ApiSuccessResponse<Community[]>> => {
    return apiClient.get<ApiSuccessResponse<Community[]>>('/community-aff-crea-join/my-created');
  },

  // Backwards-compatible alias for getMyCreated
  getByCreator: async (): Promise<ApiSuccessResponse<Community[]>> => {
    return communitiesApi.getMyCreated();
  },

  // Get public communities
  getPublic: async (): Promise<ApiSuccessResponse<Community[]>> => {
    return apiClient.get<ApiSuccessResponse<Community[]>>('/community-aff-crea-join/public/all');
  },

  // Get my joined communities
  getMyJoined: async (): Promise<ApiSuccessResponse<Community[]>> => {
    return apiClient.get<ApiSuccessResponse<Community[]>>('/community-aff-crea-join/my-joined');
  },

  // Get communities where user is owner or admin (for management purposes)
  getMyManageable: async (): Promise<ApiSuccessResponse<Community[]>> => {
    return apiClient.get<ApiSuccessResponse<Community[]>>('/community-aff-crea-join/my-manageable');
  },

  generateInviteLink: async (
    communityId: string,
    regenerate: boolean = false,
  ): Promise<ApiSuccessResponse<{ inviteCode: string; inviteLink: string }>> => {
    return apiClient.post<ApiSuccessResponse<{ inviteCode: string; inviteLink: string }>>(
      '/community-aff-crea-join/generate-invite',
      { communityId, regenerate },
    );
  },

  checkoutCommunity: async (
    id: string,
    promoCode?: string,
    inviteCode?: string,
  ): Promise<ApiSuccessResponse<any>> => {
    const endpoint = inviteCode
      ? `/community-aff-crea-join/checkout-private/${encodeURIComponent(inviteCode)}${promoCode ? `?promoCode=${encodeURIComponent(promoCode)}` : ''}`
      : `/community-aff-crea-join/${encodeURIComponent(id)}/checkout${promoCode ? `?promoCode=${encodeURIComponent(promoCode)}` : ''}`;

    return apiClient.post<ApiSuccessResponse<any>>(
      endpoint,
      inviteCode ? { inviteCode } : undefined,
    );
  },

  initManualPayment: async (
    input: CommunityManualPaymentInput,
  ): Promise<ApiSuccessResponse<any>> => {
    const communityId = String(input?.communityId || '').trim();
    const inviteCode = String(input?.inviteCode || '').trim();
    const promoCode = String(input?.promoCode || '').trim();

    if (!communityId) {
      throw new Error('communityId is required');
    }

    const formData = new FormData();
    formData.append('communityId', communityId);
    formData.append('proof', input.proof);
    if (inviteCode) {
      formData.append('inviteCode', inviteCode);
    }

    const endpoint = `${getClientApiBase()}/payment/manual/init/community${promoCode ? `?promoCode=${encodeURIComponent(promoCode)}` : ''}`;
    const authHeader = getBrowserAuthHeader();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: authHeader ? { Authorization: authHeader } : undefined,
      credentials: 'include',
      body: formData,
    });

    const data = await parseJsonSafely(response);
    if (!response.ok) {
      throw new Error(data?.message || 'Failed to initiate payment');
    }

    return data as ApiSuccessResponse<any>;
  },

  /**
   * Initialize Stripe Link payment for community membership
   * Uses apiClient for proper auth token handling and automatic refresh
   */
  initStripePayment: async (
    communityId: string,
    promoCode?: string,
    inviteCode?: string,
  ): Promise<any> => {
    const endpoint = promoCode
      ? `/payment/stripe-link/init/community?promoCode=${encodeURIComponent(promoCode)}`
      : `/payment/stripe-link/init/community`;

    return apiClient.post<any>(endpoint, {
      communityId,
      ...(inviteCode ? { inviteCode } : {}),
    });
  },
};
