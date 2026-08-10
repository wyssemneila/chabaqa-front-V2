import { apiClient, type ApiSuccessResponse } from "./client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Get published page content for a community (public - no auth required)
 */
export async function getCommunityPageContent(slug: string, apiBaseUrl = API_BASE_URL) {
  try {
    const response = await fetch(`${apiBaseUrl}/communities/${slug}/page-content`, {
      // A creator expects a successful save to be visible immediately.  This
      // endpoint is small and must never be hidden behind Next's data cache.
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page content: ${response.status}`);
    }

    return unwrapPageContentResponse(await response.json());
  } catch (error) {
    console.error('Error fetching community page content:', error);
    // Return default structure on error
    return null;
  }
}

/**
 * Get page content for editing (creator only - requires auth)
 */
export async function getPageContentForEditing(communityId: string, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/community-page-content/${communityId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch content for editing: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching content for editing:', error);
    throw error;
  }
}

/**
 * Update page content sections (creator only - requires auth)
 */
export async function updatePageContent(
  communityId: string,
  updates: {
    hero?: any;
    overview?: any;
    benefits?: any;
    testimonials?: any;
    cta?: any;
  },
  token: string
) {
  try {
    const response = await fetch(`${API_BASE_URL}/community-page-content/${communityId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update content');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating page content:', error);
    throw error;
  }
}

/**
 * Publish or unpublish page content (creator only - requires auth)
 */
export async function publishPageContent(
  communityId: string,
  isPublished: boolean,
  token: string
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/community-page-content/${communityId}/publish`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to publish content');
    }

    return await response.json();
  } catch (error) {
    console.error('Error publishing content:', error);
    throw error;
  }
}

/**
 * Add a testimonial with avatar image (creator only - requires auth)
 */
export async function addTestimonial(
  communityId: string,
  testimonial: {
    name: string;
    role: string;
    base64Avatar: string;
    rating: number;
    content: string;
    order?: number;
  },
  token: string
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/community-page-content/${communityId}/testimonials`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testimonial),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add testimonial');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding testimonial:', error);
    throw error;
  }
}

/**
 * Delete a testimonial (creator only - requires auth)
 */
export async function deleteTestimonial(
  communityId: string,
  testimonialId: string,
  token: string
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/community-page-content/${communityId}/testimonials/${testimonialId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete testimonial');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    throw error;
  }
}

/**
 * Type definitions for page content
 */
export interface PageContent {
  communityId: string;
  communitySlug: string;
  communityName: string;
  source?: "published" | "generated";
  hero: {
    customTitle?: string;
    customSubtitle?: string;
    customBanner?: string;
    ctaButtonText: string;
    showMemberCount: boolean;
    showRating: boolean;
    showCreator: boolean;
  };
  overview: {
    title: string;
    subtitle: string;
    visible: boolean;
    cards: OverviewCard[];
  };
  benefits: {
    titlePrefix: string;
    titleSuffix?: string;
    subtitle?: string;
    visible: boolean;
    ctaTitle: string;
    ctaSubtitle: string;
    benefits: BenefitItem[];
  };
  testimonials: {
    title: string;
    subtitle: string;
    visible: boolean;
    showRatings: boolean;
    testimonials: Testimonial[];
  };
  cta: {
    title: string;
    subtitle: string;
    buttonText: string;
    visible: boolean;
    customBackground?: string;
  };
  landingPage?: Record<string, unknown>;
  isPublished: boolean;
  version: number;
}

export interface OverviewCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  order: number;
  visible: boolean;
}

export interface BenefitItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  order: number;
  visible: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  content: string;
  order: number;
  visible: boolean;
  createdAt: string;
}

export type CommunityPageContentUpdate = Partial<Pick<
  PageContent,
  "hero" | "overview" | "benefits" | "testimonials" | "cta" | "landingPage"
>>;

function unwrapPageContentResponse(response: any): PageContent {
  return (response?.data || response) as PageContent;
}

export const communityPageContentApi = {
  getForEditing: async (communityId: string): Promise<PageContent> => {
    const response = await apiClient.get<ApiSuccessResponse<PageContent>>(
      `/community-page-content/${encodeURIComponent(communityId)}`,
    );
    return unwrapPageContentResponse(response);
  },

  update: async (
    communityId: string,
    updates: CommunityPageContentUpdate,
  ): Promise<PageContent> => {
    const response = await apiClient.patch<ApiSuccessResponse<PageContent>>(
      `/community-page-content/${encodeURIComponent(communityId)}`,
      updates,
    );
    return unwrapPageContentResponse(response);
  },

  saveAndPublish: async (
    communityId: string,
    updates: CommunityPageContentUpdate,
  ): Promise<PageContent> => {
    const response = await apiClient.put<ApiSuccessResponse<PageContent>>(
      `/community-page-content/${encodeURIComponent(communityId)}/landing-page`,
      updates,
    );
    return unwrapPageContentResponse(response);
  },

  publish: async (communityId: string, isPublished: boolean): Promise<PageContent> => {
    const response = await apiClient.post<ApiSuccessResponse<PageContent>>(
      `/community-page-content/${encodeURIComponent(communityId)}/publish`,
      { isPublished },
    );
    return unwrapPageContentResponse(response);
  },
};
