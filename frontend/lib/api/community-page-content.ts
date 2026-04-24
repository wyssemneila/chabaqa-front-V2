const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const PUBLIC_PAGE_CONTENT_REVALIDATE_SECONDS = 60;

/**
 * Get published page content for a community (public - no auth required)
 */
export async function getCommunityPageContent(slug: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/communities/${slug}/page-content`, {
      cache: 'force-cache',
      next: {
        revalidate: PUBLIC_PAGE_CONTENT_REVALIDATE_SECONDS,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page content: ${response.status}`);
    }

    return await response.json();
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
