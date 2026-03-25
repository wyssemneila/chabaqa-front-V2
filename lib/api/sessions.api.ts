import { apiClient, ApiSuccessResponse, PaginatedResponse, PaginationParams } from './client';
import type { ApiGetOptions } from './client';
import type { Session, SessionBooking } from './types';

export interface CreateSessionResourceData {
  title: string;
  type: 'video' | 'article' | 'code' | 'tool' | 'pdf' | 'link';
  url: string;
  description: string;
  order: number;
}

export interface CreateSessionData {
  title: string;
  description: string;
  thumbnail?: string;
  duration: number;
  price: number;
  currency: 'USD' | 'EUR' | 'TND';
  communitySlug: string;
  category?: string;
  maxBookingsPerWeek?: number;
  notes?: string;
  isActive?: boolean;
  resources: CreateSessionResourceData[];
}

export interface UpdateSessionData extends Partial<CreateSessionData> {
  isActive?: boolean;
}

export interface BookSessionData {
  scheduledAt: string;
  notes?: string;
  slotId?: string;
}

export interface UpdateBookingData {
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meetingLink?: string;
  notes?: string;
}

export interface SessionListParams extends PaginationParams {
  communitySlug?: string;
  category?: string;
  isActive?: boolean;
  creatorId?: string;
}

export type MeetStatus = 'not_required' | 'pending' | 'created' | 'failed';

export interface CreatorBookingViewModel {
  id: string;
  oderId?: string;
  orderId?: string;
  sessionId: string;
  sessionTitle: string;
  sessionDuration: number;
  sessionPrice: number;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  scheduledAt: string;
  isUpcoming: boolean;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meetingUrl?: string;
  googleEventId?: string;
  meetStatus?: MeetStatus;
  meetFailureReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  upcoming: number;
  past: number;
}

export interface CreatorBookingsResponse {
  bookings: CreatorBookingViewModel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: BookingStats;
}

const normalizeCreatorBookingsResponse = (raw: any): CreatorBookingsResponse => {
  const payload = raw?.data?.bookings
    ? raw.data
    : raw?.data?.data?.bookings
      ? raw.data.data
      : raw;

  const bookingsRaw = Array.isArray(payload?.bookings) ? payload.bookings : [];
  const bookings: CreatorBookingViewModel[] = bookingsRaw.map((booking: any) => ({
    ...booking,
    id: booking?.id || booking?._id || '',
    orderId: booking?.orderId || booking?.oderId,
    meetStatus: booking?.meetStatus || (booking?.meetingUrl ? 'created' : 'not_required'),
  }));

  return {
    bookings,
    total: Number(payload?.total ?? bookings.length ?? 0),
    page: Number(payload?.page ?? 1),
    limit: Number(payload?.limit ?? bookings.length ?? 0),
    totalPages: Number(payload?.totalPages ?? 1),
    stats: payload?.stats || {
      total: bookings.length,
      pending: bookings.filter((b: CreatorBookingViewModel) => b.status === 'pending').length,
      confirmed: bookings.filter((b: CreatorBookingViewModel) => b.status === 'confirmed').length,
      completed: bookings.filter((b: CreatorBookingViewModel) => b.status === 'completed').length,
      cancelled: bookings.filter((b: CreatorBookingViewModel) => b.status === 'cancelled').length,
      upcoming: bookings.filter((b: CreatorBookingViewModel) => b.isUpcoming && b.status !== 'cancelled').length,
      past: bookings.filter((b: CreatorBookingViewModel) => !b.isUpcoming).length,
    },
  };
};

// Sessions API
export const sessionsApi = {
  // Get all sessions
  getAll: async (
    params?: SessionListParams,
    options?: ApiGetOptions,
  ): Promise<PaginatedResponse<Session>> => {
    return apiClient.get<PaginatedResponse<Session>>('/sessions', params, options);
  },

  // Create session
  create: async (data: CreateSessionData): Promise<ApiSuccessResponse<Session>> => {
    return apiClient.post<ApiSuccessResponse<Session>>('/sessions', data);
  },

  // Get session by ID
  getById: async (id: string): Promise<ApiSuccessResponse<Session>> => {
    return apiClient.get<ApiSuccessResponse<Session>>(`/sessions/${id}`);
  },

  // Update session
  update: async (id: string, data: UpdateSessionData): Promise<ApiSuccessResponse<Session>> => {
    return apiClient.patch<ApiSuccessResponse<Session>>(`/sessions/${id}`, data);
  },

  // Delete session
  delete: async (id: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.delete<ApiSuccessResponse<void>>(`/sessions/${id}`);
  },

  // Get sessions by community (using slug)
  getByCommunity: async (slug: string): Promise<any> => {
    return apiClient.get(`/sessions/community/${slug}`);
  },

  // Book session
  book: async (id: string, data: BookSessionData, promoCode?: string): Promise<ApiSuccessResponse<SessionBooking>> => {
    const url = promoCode ? `/sessions/${id}/book?promoCode=${encodeURIComponent(promoCode)}` : `/sessions/${id}/book`;
    return apiClient.post<ApiSuccessResponse<SessionBooking>>(url, data);
  },

  // Get bookings
  getBookings: async (id: string, params?: PaginationParams): Promise<PaginatedResponse<SessionBooking>> => {
    return apiClient.get<PaginatedResponse<SessionBooking>>(`/sessions/${id}/bookings`, params);
  },

  // Update booking
  updateBooking: async (id: string, bookingId: string, data: UpdateBookingData): Promise<ApiSuccessResponse<SessionBooking>> => {
    return apiClient.patch<ApiSuccessResponse<SessionBooking>>(`/sessions/${id}/bookings/${bookingId}`, data);
  },

  // Confirm booking
  confirmBooking: async (bookingId: string, data: { meetingUrl?: string; notes?: string }): Promise<ApiSuccessResponse<Session>> => {
    return apiClient.patch<ApiSuccessResponse<Session>>(`/sessions/bookings/${bookingId}/confirm`, data);
  },

  // Cancel booking
  cancelBooking: async (bookingId: string, data: { reason?: string }): Promise<ApiSuccessResponse<Session>> => {
    return apiClient.patch<ApiSuccessResponse<Session>>(`/sessions/bookings/${bookingId}/cancel`, data);
  },

  // Complete session
  completeSession: async (bookingId: string, data: { notes?: string; rating?: number }): Promise<ApiSuccessResponse<Session>> => {
    return apiClient.patch<ApiSuccessResponse<Session>>(`/sessions/bookings/${bookingId}/complete`, data);
  },

  // Complete booking (alias used by creator workflow pages)
  completeBooking: async (bookingId: string, data: { notes?: string; rating?: number } = {}): Promise<ApiSuccessResponse<Session>> => {
    return apiClient.patch<ApiSuccessResponse<Session>>(`/sessions/bookings/${bookingId}/complete`, data);
  },

  // Create Meet link for booking
  createMeetLink: async (bookingId: string): Promise<ApiSuccessResponse<{ bookingId: string; meetingUrl?: string; googleEventId?: string; meetStatus: MeetStatus; meetFailureReason?: string }>> => {
    return apiClient.post<ApiSuccessResponse<{ bookingId: string; meetingUrl?: string; googleEventId?: string; meetStatus: MeetStatus; meetFailureReason?: string }>>(`/sessions/bookings/${bookingId}/create-meet`, {});
  },

  createMeet: async (bookingId: string): Promise<ApiSuccessResponse<{ bookingId: string; meetingUrl?: string; googleEventId?: string; meetStatus: MeetStatus; meetFailureReason?: string }>> => {
    return apiClient.post<ApiSuccessResponse<{ bookingId: string; meetingUrl?: string; googleEventId?: string; meetStatus: MeetStatus; meetFailureReason?: string }>>(`/sessions/bookings/${bookingId}/create-meet`, {});
  },

  // Get Meet provisioning status
  getMeetStatus: async (bookingId: string): Promise<ApiSuccessResponse<{ bookingId: string; meetStatus: MeetStatus; meetingUrl?: string; googleEventId?: string; meetFailureReason?: string; meetRetryCount?: number; meetLastAttemptAt?: string }>> => {
    return apiClient.get<ApiSuccessResponse<{ bookingId: string; meetStatus: MeetStatus; meetingUrl?: string; googleEventId?: string; meetFailureReason?: string; meetRetryCount?: number; meetLastAttemptAt?: string }>>(`/sessions/bookings/${bookingId}/meet-status`);
  },

  // Set available hours
  setAvailableHours: async (id: string, data: any): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(`/sessions/${id}/available-hours`, data);
  },

  // Get available hours
  getAvailableHours: async (id: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/sessions/${id}/available-hours`);
  },

  // Generate slots
  generateSlots: async (id: string, data: { startDate: string; endDate: string }): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(`/sessions/${id}/generate-slots`, data);
  },

  // Get available slots
  getAvailableSlots: async (id: string, params?: { startDate?: string; endDate?: string }): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/sessions/${id}/available-slots`, params);
  },

  // Book specific slot
  bookSlot: async (id: string, data: { slotId: string; notes?: string }): Promise<ApiSuccessResponse<Session>> => {
    return apiClient.post<ApiSuccessResponse<Session>>(`/sessions/${id}/book-slot`, data);
  },

  // Cancel slot
  cancelSlot: async (id: string, slotId: string): Promise<ApiSuccessResponse<Session>> => {
    return apiClient.patch<ApiSuccessResponse<Session>>(`/sessions/${id}/cancel-slot/${slotId}`, {});
  },

  // Get creator bookings with filters
  getCreatorBookings: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    timeFilter?: string;
    sessionId?: string;
    search?: string;
  }): Promise<CreatorBookingsResponse> => {
    const response = await apiClient.get<any>('/sessions/bookings/creator', params);
    return normalizeCreatorBookingsResponse(response);
  },

  // Get user bookings
  getUserBookings: async (): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/sessions/bookings/user');
  },

  retryMeetProvisioning: async (): Promise<{ success: boolean; scanned: number; attempted: number; succeeded: number; failed: number }> => {
    return apiClient.post<{ success: boolean; scanned: number; attempted: number; succeeded: number; failed: number }>('/sessions/bookings/retry-meet', {});
  },

  // Get sessions by user (creator)
  getByCreator: async (userId: string, params?: { page?: number; limit?: number; isActive?: boolean }): Promise<any> => {
    return apiClient.get(`/sessions/by-user/${userId}`, params);
  },

  // Initiate Stripe Link payment for session
  initStripePayment: async (sessionId: string, bookingDto: BookSessionData, promoCode?: string): Promise<any> => {
    const endpoint = promoCode
      ? `/payment/stripe-link/init/session?promoCode=${encodeURIComponent(promoCode)}`
      : `/payment/stripe-link/init/session`;
    return apiClient.post<any>(endpoint, { sessionId, bookingDto });
  },

  // Finalize booking for already-paid session orders
  finalizePaidSessionBooking: async (
    orderId: string,
    bookingDto: BookSessionData,
  ): Promise<any> => {
    return apiClient.post<any>('/payment/session/finalize-booking', {
      orderId,
      ...bookingDto,
    });
  },
};
