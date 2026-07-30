import { apiClient, ApiSuccessResponse, PaginatedResponse, PaginationParams } from './client';
import type { ApiGetOptions } from './client';
import type { Event, EventTicket } from './types';

export interface CreateEventSessionData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  speaker?: string;
  notes?: string;
  isActive?: boolean;
}

export interface CreateEventTicketData {
  type: string;
  name: string;
  price: number;
  quantity?: number;
  description?: string;
}

export interface CreateEventSpeakerData {
  name: string;
  title: string;
  bio: string;
  photo?: string;
}

export interface CreateEventData {
  communityId: string;

  title: string;
  description: string;

  startDate: string;
  endDate?: string;

  startTime: string;
  endTime: string;

  timezone: string;
  location?: string;
  onlineUrl?: string;

  category: string;
  type: 'In-person' | 'Online' | 'Hybrid';

  notes?: string;
  image?: string;

  sessions?: CreateEventSessionData[];
  tickets?: CreateEventTicketData[];
  speakers?: CreateEventSpeakerData[];

  tags?: string[];

  isActive?: boolean;
  isPublished?: boolean;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  isPublished?: boolean;
}

export interface CreateTicketData {
  name: string;
  price: number;
  quantity?: number;
  description?: string;
}

export interface EventListParams extends PaginationParams {
  communityId?: string;
  category?: string;
  type?: string;
  isActive?: boolean;
  isPublished?: boolean;
  search?: string;
}

export const normalizeEventResponse = (response: any): any => {
  if (!response) return response;
  if (response?.event) return response.event;
  if (response?.data?.event) return response.data.event;
  if (response?.data?.data?.event) return response.data.data.event;
  if (response?.data?.data) return response.data.data;
  if (response?.data) return response.data;
  return response;
};

export const normalizeEventListResponse = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.events)) return response.events;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.events)) return response.data.events;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.data?.events)) return response.data.data.events;
  return [];
};

// Events API
export const eventsApi = {
  // Get all events
  getAll: async (
    params?: EventListParams,
    options?: ApiGetOptions,
  ): Promise<PaginatedResponse<Event>> => {
    return apiClient.get<PaginatedResponse<Event>>('/events', params, options);
  },

  // Create event
  create: async (data: CreateEventData): Promise<any> => {
    return apiClient.post<any>('/events', data);
  },

  // Get event by ID
  getById: async (id: string): Promise<any> => {
    return apiClient.get<any>(`/events/${id}`);
  },

  // Update event
  update: async (id: string, data: UpdateEventData): Promise<any> => {
    return apiClient.patch<any>(`/events/${id}`, data);
  },

  // Delete event
  delete: async (id: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.delete<ApiSuccessResponse<void>>(`/events/${id}`);
  },

  // Get upcoming events
  getUpcoming: async (): Promise<ApiSuccessResponse<Event[]>> => {
    return apiClient.get<ApiSuccessResponse<Event[]>>('/events/upcoming');
  },

  // Register for event
  register: async (id: string, ticketType: string, promoCode?: string): Promise<ApiSuccessResponse<void>> => {
    const endpoint = promoCode 
      ? `/events/${id}/register?promoCode=${encodeURIComponent(promoCode)}`
      : `/events/${id}/register`;
    return apiClient.post<ApiSuccessResponse<void>>(endpoint, { ticketType });
  },

  initStripePayment: async (eventId: string, ticketType: string, promoCode?: string, idempotencyKey?: string): Promise<any> => {
    const endpoint = promoCode
      ? `/payment/stripe-link/init/event?promoCode=${encodeURIComponent(promoCode)}`
      : `/payment/stripe-link/init/event`;

    return apiClient.post<any>(endpoint, { eventId, ticketType }, { headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined });
  },

  // Unregister from event
  unregister: async (id: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.post<ApiSuccessResponse<void>>(`/events/${id}/unregister`, {});
  },

  // Get attendees
  getAttendees: async (id: string, params?: PaginationParams): Promise<PaginatedResponse<any>> => {
    return apiClient.get<PaginatedResponse<any>>(`/events/${id}/attendees`, params);
  },

  // Get tickets
  getTickets: async (id: string): Promise<ApiSuccessResponse<EventTicket[]>> => {
    return apiClient.get<ApiSuccessResponse<EventTicket[]>>(`/events/${id}/tickets`);
  },

  // Get sessions
  getSessions: async (id: string): Promise<ApiSuccessResponse<any[]>> => {
    return apiClient.get<ApiSuccessResponse<any[]>>(`/events/${id}/sessions`);
  },

  // Get speakers
  getSpeakers: async (id: string): Promise<ApiSuccessResponse<any[]>> => {
    return apiClient.get<ApiSuccessResponse<any[]>>(`/events/${id}/speakers`);
  },

  // Get events by creator
  getByCreator: async (creatorId: string, params?: PaginationParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/events/creator/${creatorId}`, params);
  },

  // Get event stats
  getStats: async (communityId?: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/events/stats', communityId ? { communityId } : undefined);
  },

  // Get my registrations
  getMyRegistrations: async (): Promise<ApiSuccessResponse<Event[]>> => {
    return apiClient.get<ApiSuccessResponse<Event[]>>('/events/my-registrations');
  },

  // Get QR token for event registration
  getQrToken: async (id: string): Promise<ApiSuccessResponse<{ token: string; payload: any; expiresIn: string }>> => {
    return apiClient.get<ApiSuccessResponse<{ token: string; payload: any; expiresIn: string }>>(`/events/${id}/qr`);
  },

  // Toggle published status
  togglePublished: async (id: string): Promise<ApiSuccessResponse<{ isPublished: boolean; message: string }>> => {
    return apiClient.patch<ApiSuccessResponse<{ isPublished: boolean; message: string }>>(`/events/${id}/toggle-published`, {});
  },

  // Add session to event
  addSession: async (id: string, data: CreateEventSessionData): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(`/events/${id}/sessions`, data);
  },

  // Remove session from event
  removeSession: async (id: string, sessionId: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.delete<ApiSuccessResponse<void>>(`/events/${id}/sessions/${sessionId}`);
  },

  // Update session in event
  updateSession: async (id: string, sessionId: string, data: Partial<CreateEventSessionData>): Promise<ApiSuccessResponse<any>> => {
    return apiClient.patch<ApiSuccessResponse<any>>(`/events/${id}/sessions/${sessionId}`, data);
  },

  // Add ticket to event
  addTicket: async (id: string, data: CreateEventTicketData): Promise<ApiSuccessResponse<EventTicket>> => {
    return apiClient.post<ApiSuccessResponse<EventTicket>>(`/events/${id}/tickets`, data);
  },

  // Remove ticket from event
  removeTicket: async (id: string, ticketId: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.delete<ApiSuccessResponse<void>>(`/events/${id}/tickets/${ticketId}`);
  },

  // Add speaker to event
  addSpeaker: async (id: string, data: CreateEventSpeakerData): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(`/events/${id}/speakers`, data);
  },

  // Remove speaker from event
  removeSpeaker: async (id: string, speakerId: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.delete<ApiSuccessResponse<void>>(`/events/${id}/speakers/${speakerId}`);
  },
};
