import { apiClient, ApiSuccessResponse } from './client';
import type { User, Community, CourseEnrollment, SessionBooking } from './types';

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  avatar?: string;
}

export interface CreatorStats {
  totalProducts: number;
  totalSales: number;
  rating: number;
  ratingCount: number;
}

export interface CreatorProfile {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  photo_profil?: string;
  profile_picture?: string;
  ville?: string;
  pays?: string;
  role: string;
  createdAt: string;
}

function normalizeEntityId(value: any): string {
  if (!value) return '';

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '[object Object]') {
      return '';
    }
    const objectIdMatch = trimmed.match(/[a-fA-F0-9]{24}/);
    return objectIdMatch ? objectIdMatch[0] : trimmed;
  }

  if (typeof value === 'object') {
    const directCandidates = [
      value._id,
      value.id,
      value.creatorId,
      value.userId,
      value.value,
    ];

    for (const candidate of directCandidates) {
      const normalized = normalizeEntityId(candidate);
      if (normalized) {
        return normalized;
      }
    }

    try {
      const serialized = String(value || '').trim();
      if (serialized && serialized !== '[object Object]') {
        const normalized = normalizeEntityId(serialized);
        if (normalized) {
          return normalized;
        }
      }
    } catch {
      return '';
    }
  }

  return '';
}

// Users API
export const usersApi = {
  // Get user by ID
  getById: async (id: string): Promise<ApiSuccessResponse<User>> => {
    return apiClient.get<ApiSuccessResponse<User>>(`/users/${id}`);
  },

  // Get user profile by ID (returns user object directly)
  getProfile: async (id: string): Promise<CreatorProfile | null> => {
    const normalizedId = normalizeEntityId(id);
    if (!normalizedId) {
      return null;
    }
    try {
      const response = await apiClient.get<any>(`/user/user/${normalizedId}`);
      return response?.user || response?.data?.user || null;
    } catch {
      return null;
    }
  },

  // Get creator stats (products count, sales, rating)
  getCreatorStats: async (creatorId: string): Promise<CreatorStats> => {
    const normalizedCreatorId = normalizeEntityId(creatorId);
    if (!normalizedCreatorId) {
      return { totalProducts: 0, totalSales: 0, rating: 0, ratingCount: 0 };
    }

    const parseProductsPayload = (response: any) => {
      const responseData = response?.data || response;
      const innerData = responseData?.data || responseData;
      const products = Array.isArray(innerData?.products)
        ? innerData.products
        : Array.isArray(responseData?.products)
          ? responseData.products
          : Array.isArray(innerData)
            ? innerData
            : [];
      const pagination = innerData?.pagination || responseData?.pagination || {};
      return { products, pagination };
    };

    const calculateStats = (products: any[], pagination: any): CreatorStats => {
      const totalSales = products.reduce(
        (sum: number, p: any) => sum + Number(p?.sales || 0),
        0,
      );

      const ratedProducts = products.filter(
        (p: any) => Number(p?.averageRating || p?.rating || 0) > 0,
      );
      const avgRating =
        ratedProducts.length > 0
          ? ratedProducts.reduce(
              (sum: number, p: any) =>
                sum + Number(p?.averageRating || p?.rating || 0),
              0,
            ) / ratedProducts.length
          : 0;

      const paginatedTotal = Number(pagination?.total || 0);
      return {
        totalProducts: paginatedTotal > 0 ? paginatedTotal : products.length,
        totalSales,
        rating: Math.round(avgRating * 10) / 10,
        ratingCount: ratedProducts.length,
      };
    };

    const endpoints = [
      `/products/creator/${normalizedCreatorId}?limit=100`,
      `/products/by-user/${normalizedCreatorId}?limit=100`,
    ];

    let lastError: unknown = null;
    try {
      for (const endpoint of endpoints) {
        try {
          const response = await apiClient.get<any>(endpoint);
          const { products, pagination } = parseProductsPayload(response);
          const hasAnyData = products.length > 0 || Number(pagination?.total || 0) > 0;
          if (hasAnyData || endpoint === endpoints[endpoints.length - 1]) {
            return calculateStats(products, pagination);
          }
        } catch (error) {
          lastError = error;
        }
      }
    } catch (error) {
      lastError = error;
    }

    if (lastError) {
      console.error('Failed to fetch creator stats:', lastError);
    }

    try {
      const fallbackResponse = await apiClient.get<any>(`/products?creatorId=${normalizedCreatorId}&limit=100`);
      const { products, pagination } = parseProductsPayload(fallbackResponse);
      return calculateStats(products, pagination);
    } catch (fallbackError) {
      console.error('Failed to fetch creator stats fallback:', fallbackError);
      return { totalProducts: 0, totalSales: 0, rating: 0, ratingCount: 0 };
    }
  },

  // Update user
  update: async (id: string, data: UpdateUserData): Promise<ApiSuccessResponse<User>> => {
    return apiClient.patch<ApiSuccessResponse<User>>(`/users/${id}`, data);
  },

  // Get user communities
  getCommunities: async (id: string): Promise<ApiSuccessResponse<Community[]>> => {
    return apiClient.get<ApiSuccessResponse<Community[]>>(`/users/${id}/communities`);
  },

  // Get user enrollments
  getEnrollments: async (id: string): Promise<ApiSuccessResponse<CourseEnrollment[]>> => {
    return apiClient.get<ApiSuccessResponse<CourseEnrollment[]>>(`/users/${id}/enrollments`);
  },

  // Get user bookings
  getBookings: async (id: string): Promise<ApiSuccessResponse<SessionBooking[]>> => {
    return apiClient.get<ApiSuccessResponse<SessionBooking[]>>(`/users/${id}/bookings`);
  },

  // Get user purchases
  getPurchases: async (id: string): Promise<ApiSuccessResponse<any[]>> => {
    return apiClient.get<ApiSuccessResponse<any[]>>(`/users/${id}/purchases`);
  },
};
