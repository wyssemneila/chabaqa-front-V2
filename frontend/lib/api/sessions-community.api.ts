import { apiClient } from './client';
import { sessionsApi } from './sessions.api';
import { communitiesApi } from './communities.api';
import { getMe } from './user.api';
import type { Session, SessionBooking } from './types';

export interface SessionWithMentor extends Session {
  mentor?: {
    name: string;
    avatar?: string;
    role?: string;
    rating?: number;
    reviews?: number;
  };
  averageRating?: number;
  ratingCount?: number;
  communitySlug?: string;
  tags?: string[];
  category?: string;
  bookingsCount?: number;
  bookingsThisWeek?: number;
  canBookMore?: boolean;
  bookings?: any[];
  notes?: string;
  resources?: any[];
}

export interface BookingWithSession extends SessionBooking {
  session?: SessionWithMentor;
  meetingUrl?: string;
  amountPaid?: number;
}

export interface SessionsPageData {
  community: any;
  sessions: SessionWithMentor[];
  userBookings: BookingWithSession[];
  currentUser: any;
}

/**
 * Transform backend session data to frontend format
 */
function transformSession(backendSession: any): SessionWithMentor {
  // Transform creator to mentor format
  // Backend can return creator data in two ways:
  // 1. Populated: creatorId is an object with { name, email, photo_profil, profile_picture, avatar }
  // 2. DTO transformed: creatorId is a string, creatorName and creatorAvatar are separate fields
  
  const isPopulated = typeof backendSession.creatorId === 'object' && backendSession.creatorId !== null;
  
  let creatorAvatar: string | undefined;
  let creatorName: string;
  
  if (isPopulated) {
    // Populated format - check all possible avatar fields
    const creatorData = backendSession.creatorId;
    creatorAvatar = creatorData.photo_profil || 
                    creatorData.profile_picture || 
                    creatorData.avatar || 
                    undefined;
    creatorName = creatorData.name || 'Unknown';
  } else {
    // DTO format - use direct fields
    creatorAvatar = backendSession.creatorAvatar || undefined;
    creatorName = backendSession.creatorName || 'Unknown';
  }
  
  const averageRating = Number(backendSession.averageRating || 0);
  const ratingCount = Number(backendSession.ratingCount || 0);

  const mentor = {
    name: creatorName,
    avatar: creatorAvatar,
    role: 'Mentor',
    rating: averageRating,
    reviews: ratingCount,
  };

  // Extract tags from category or description
  const tags: string[] = [];
  if (backendSession.category) {
    tags.push(backendSession.category);
  }
  if (backendSession.description) {
    const techKeywords = ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python', 'Career', 'Architecture', 'Code Review'];
    techKeywords.forEach(keyword => {
      if (backendSession.description.toLowerCase().includes(keyword.toLowerCase()) && !tags.includes(keyword)) {
        tags.push(keyword);
      }
    });
  }
  if (tags.length === 0) {
    tags.push('Mentorship', '1-on-1');
  }

  return {
    id: String(backendSession.id || backendSession._id || ''),
    title: backendSession.title || '',
    description: backendSession.description || '',
    thumbnail: backendSession.thumbnail || backendSession.image || undefined,
    image: backendSession.image || backendSession.thumbnail || undefined,
    duration: backendSession.duration || 60,
    price: backendSession.price || 0,
    currency: backendSession.currency || 'TND',
    communityId: String(backendSession.communityId || ''),
    communitySlug: backendSession.communitySlug || undefined,
    communityName: backendSession.communityName || undefined,
    creatorId: isPopulated 
      ? String(backendSession.creatorId?._id || backendSession.creatorId?.id || '') 
      : String(backendSession.creatorId || ''),
    isActive: backendSession.isActive !== false,
    availableSlots: backendSession.availableSlots || 0,
    bookedSlots: backendSession.bookedSlots || 0,
    createdAt: backendSession.createdAt || new Date().toISOString(),
    updatedAt: backendSession.updatedAt || new Date().toISOString(),
    mentor,
    averageRating,
    ratingCount,
    tags,
    category: backendSession.category || 'General',
    bookingsCount: backendSession.bookingsCount || 0,
    bookingsThisWeek: backendSession.bookingsThisWeek || 0,
    canBookMore: backendSession.canBookMore !== false,
    bookings: backendSession.bookings || [],
    notes: backendSession.notes || undefined,
    resources: backendSession.resources || [],
  };
}

/**
 * Transform backend booking data to frontend format
 */
function transformBooking(backendBooking: any, session?: any): BookingWithSession {
  const sessionData = session ? transformSession(session) : undefined;

  return {
    id: String(backendBooking._id || backendBooking.id || ''),
    userId: String(backendBooking.userId?._id || backendBooking.userId || ''),
    sessionId: String(backendBooking.sessionId?._id || backendBooking.sessionId || ''),
    creatorId: String(backendBooking.creatorId || ''),
    communityId: String(backendBooking.communityId || ''),
    scheduledAt: backendBooking.scheduledAt || new Date().toISOString(),
    status: backendBooking.status || 'pending',
    meetingUrl: backendBooking.meetingUrl || undefined,
    notes: backendBooking.notes || undefined,
    createdAt: backendBooking.createdAt || new Date().toISOString(),
    updatedAt: backendBooking.updatedAt || new Date().toISOString(),
    session: sessionData,
  };
}

/**
 * Sessions Community API Service
 */
export const sessionsCommunityApi = {
  /**
   * Fetch all data needed for sessions page (public data only - no auth required)
   */
  async getSessionsPageData(slug: string): Promise<SessionsPageData> {
    try {
      // Fetch public data only (community and sessions)
      const [communityResponse, sessionsResponse] = await Promise.allSettled([
        communitiesApi.getBySlug(slug),
        sessionsApi.getByCommunity(slug),
      ]);

      // Handle community
      if (communityResponse.status === 'rejected') {
        throw new Error(`Failed to fetch community: ${communityResponse.reason}`);
      }
      const community = communityResponse.value.data;

      // Handle sessions - filter to only active sessions
      let sessions: SessionWithMentor[] = [];
      if (sessionsResponse.status === 'fulfilled') {
        const sessionsData = sessionsResponse.value;
        const sessionsList = sessionsData?.data || sessionsData || [];
        sessions = Array.isArray(sessionsList)
          ? sessionsList.filter((s: any) => s.isActive !== false).map(transformSession)
          : [];
      }

      // User bookings will be fetched client-side with proper auth
      return {
        community,
        sessions,
        userBookings: [],
        currentUser: null,
      };
    } catch (error) {
      console.error('Error fetching sessions page data:', error);
      throw error;
    }
  },

  /**
   * Fetch user bookings (requires authentication - call from client-side only)
   */
  async getUserBookings(options?: {
    communityId?: string;
    communitySlug?: string;
    sessionIds?: string[];
  }): Promise<BookingWithSession[]> {
    try {
      const normalizedCommunityId = String(options?.communityId || '').trim();
      const normalizedCommunitySlug = String(options?.communitySlug || '').trim().toLowerCase();
      const sessionIds = new Set(
        (options?.sessionIds || []).map((id) => String(id || '').trim()).filter(Boolean),
      );

      const queryParams: Record<string, string> = {};
      if (normalizedCommunityId) {
        queryParams.communityId = normalizedCommunityId;
      } else if (normalizedCommunitySlug) {
        queryParams.communitySlug = normalizedCommunitySlug;
      }

      const response = await apiClient.get<any>(
        '/sessions/bookings/user',
        Object.keys(queryParams).length > 0 ? queryParams : undefined,
      );

      // Backend returns { bookings: [...], total: number }
      const bookingsList = response?.bookings || response?.data?.bookings || [];

      if (!Array.isArray(bookingsList)) {
        return [];
      }

      const mappedBookings = bookingsList.map((booking: any) => {
        // Build session info from the booking data
        const sessionInfo = {
          id: booking.sessionId || '',
          title: booking.sessionTitle || 'Session',
          description: '',
          duration: booking.sessionDuration || 60,
          price: booking.sessionPrice || 0,
          currency: booking.sessionCurrency || 'TND',
          creatorId: '',
          creatorName: booking.creatorName || 'Unknown',
          creatorAvatar: booking.creatorAvatar || undefined,
          communityId: booking.communityId || '',
          communitySlug: booking.communitySlug || booking.sessionCommunitySlug || undefined,
          isActive: true,
          category: '',
        };

        return {
          id: booking.id || '',
          sessionId: booking.sessionId || '',
          creatorId: booking.creatorId || '',
          communityId: booking.communityId || '',
          communitySlug: booking.communitySlug || booking.sessionCommunitySlug || undefined,
          userId: booking.userId || '',
          scheduledAt: booking.scheduledAt || new Date().toISOString(),
          status: booking.status || 'pending',
          meetingUrl: booking.meetingUrl || undefined,
          notes: booking.notes || undefined,
          createdAt: booking.createdAt || new Date().toISOString(),
          updatedAt: booking.updatedAt || new Date().toISOString(),
          amountPaid: booking.amountPaid, // Pass through amountPaid
          session: transformSession(sessionInfo),
        };
      });

      return mappedBookings.filter((booking: any) => {
        const bookingCommunityId = String(
          booking?.communityId || booking?.session?.communityId || '',
        ).trim();
        if (normalizedCommunityId) {
          return bookingCommunityId === normalizedCommunityId;
        }

        const bookingCommunitySlug = String(
          booking?.communitySlug || booking?.session?.communitySlug || '',
        ).trim().toLowerCase();
        if (normalizedCommunitySlug && bookingCommunitySlug) {
          return bookingCommunitySlug === normalizedCommunitySlug;
        }

        const bookingSessionId = String(booking?.sessionId || booking?.session?.id || '').trim();
        if (sessionIds.size > 0 && bookingSessionId) {
          return sessionIds.has(bookingSessionId);
        }

        return true;
      });
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      return [];
    }
  },

  /**
   * Get current user (requires authentication - call from client-side only)
   */
  async getCurrentUser(): Promise<any> {
    try {
      const user = await getMe();
      if (!user) return null;
      
      return {
        id: String(user._id || user.id || ''),
        email: user.email || '',
        username: user.username || user.name || '',
        firstName: user.firstName || user.name?.split(' ')[0] || undefined,
        lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || undefined,
        avatar: user.avatar || user.profile_picture || undefined,
        bio: user.bio || undefined,
        role: user.role || 'member',
        verified: user.verified || false,
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: user.updatedAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  },
};
