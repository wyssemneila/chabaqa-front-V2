import { apiClient, ApiSuccessResponse } from './client';
import { communitiesApi } from './communities.api';
import { getMe } from './user.api';
import type { Event, EventTicket } from './types';
import { resolveImageUrl } from '@/lib/resolve-image-url';

export interface EventWithTickets extends Event {
  tickets: EventTicket[];
  speakers?: any[];
  sessions?: any[];
  isRegistered?: boolean;
  registrationDate?: string;
  organizerName?: string;
  organizerAvatar?: string;
  communityName?: string;
  communitySlug?: string;
}

export interface EventRegistration {
  id: string;
  event: EventWithTickets;
  ticket: EventTicket;
  quantity: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  registeredAt: string;
}

export interface EventsPageData {
  community: any;
  events: EventWithTickets[];
  userRegistrations: EventRegistration[];
  currentUser: any;
}

/**
 * Transform backend event data to frontend format
 */
function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringOrUndefined(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function toIsoOrUndefined(value: unknown): string | undefined {
  const str = toStringOrUndefined(value);
  if (!str) return undefined;
  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function unwrapEventsList(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.events)) return payload.events;
  if (Array.isArray(payload.data?.events)) return payload.data.events;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

function resolveRegistrationTicket(eventSource: any, userRegistration: any): any | undefined {
  const tickets = Array.isArray(eventSource?.tickets) ? eventSource.tickets : [];
  if (tickets.length === 0) return undefined;

  const requestedValues = [
    userRegistration?.ticketType,
    userRegistration?.ticketId,
    userRegistration?.ticket?._id,
    userRegistration?.ticket?.id,
    userRegistration?.ticket?.type,
  ]
    .map((value) => toStringOrUndefined(value)?.toLowerCase())
    .filter(Boolean) as string[];

  if (requestedValues.length > 0) {
    const matched = tickets.find((ticket: any) => {
      const candidates = [
        ticket?._id,
        ticket?.id,
        ticket?.type,
      ]
        .map((value) => toStringOrUndefined(value)?.toLowerCase())
        .filter(Boolean);
      return candidates.some((candidate) => requestedValues.includes(candidate));
    });

    if (matched) {
      return matched;
    }
  }

  return tickets[0];
}

function unwrapRegistrationsList(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.events)) return payload.events;
  if (Array.isArray(payload.data?.events)) return payload.data.events;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

function transformEvent(backendEvent: any): EventWithTickets {
  const source = backendEvent || {};

  // Transform tickets
  const tickets = (source.tickets || []).map((ticket: any, index: number) => ({
    id: String(ticket?._id || ticket?.id || ticket?.type || `ticket-${index}`),
    type: ticket?.type || 'general',
    name: ticket?.name || 'General Admission',
    price: toNumber(ticket?.price),
    description: toStringOrUndefined(ticket?.description),
    quantity: typeof ticket?.quantity === 'number' ? ticket.quantity : undefined,
    sold: toNumber(ticket?.sold),
  }));

  // Transform speakers
  const speakers = (source.speakers || []).map((speaker: any, index: number) => ({
    id: String(speaker?._id || speaker?.id || `speaker-${index}`),
    name: speaker?.name || 'Unknown',
    title: toStringOrUndefined(speaker?.title),
    bio: toStringOrUndefined(speaker?.bio),
    photo: resolveImageUrl(speaker?.photo),
  }));

  // Transform sessions
  const sessions = (source.sessions || []).map((session: any, index: number) => ({
    id: String(session?._id || session?.id || `session-${index}`),
    title: session?.title || '',
    description: toStringOrUndefined(session?.description),
    startTime: toStringOrUndefined(session?.startTime),
    endTime: toStringOrUndefined(session?.endTime),
    speaker: toStringOrUndefined(session?.speaker),
    notes: toStringOrUndefined(session?.notes),
    isActive: session?.isActive !== false,
    attendance: toNumber(session?.attendance),
  }));

  const fallbackStartDate = new Date().toISOString();
  const startDate = toIsoOrUndefined(source.startDate) || fallbackStartDate;
  const endDate = toIsoOrUndefined(source.endDate);
  const image = resolveImageUrl(
    source.image ||
    source.thumbnail ||
    source.coverImage
  );
  const organizerName = source.creator?.name || source.organizer?.name || undefined;
  const organizerAvatar = resolveImageUrl(
    source.creator?.avatar ||
    source.creator?.photo ||
    source.organizer?.avatar
  );
  const communityId =
    source.communityId?._id ||
    source.communityId?.id ||
    source.community?._id ||
    source.community?.id ||
    source.communityId ||
    '';
  const creatorId =
    source.creatorId?._id ||
    source.creatorId?.id ||
    source.creator?._id ||
    source.creator?.id ||
    source.creatorId ||
    '';
  const attendees = Array.isArray(source.attendees) ? source.attendees : [];
  const type = toStringOrUndefined(source.type) || 'General';
  const onlineUrl = toStringOrUndefined(source.onlineUrl);
  const isVirtualByType = type.toLowerCase().includes('online') || type.toLowerCase().includes('hybrid');
  const startTime = toStringOrUndefined(source.startTime);
  const endTime = toStringOrUndefined(source.endTime);
  const ticketMinPrice = tickets.length > 0 ? Math.min(...tickets.map((ticket) => toNumber(ticket.price))) : toNumber(source.price);

  return {
    id: String(source.id || source._id || ''),
    title: source.title || 'Untitled event',
    slug: source.slug || '',
    description: source.description || '',
    communityId: String(communityId),
    creatorId: String(creatorId),
    thumbnail: image,
    startDate,
    endDate,
    startTime,
    endTime,
    notes: toStringOrUndefined(source.notes),
    timezone: source.timezone || 'UTC',
    location: toStringOrUndefined(source.location),
    isVirtual: Boolean(onlineUrl) || isVirtualByType,
    maxAttendees: typeof source.maxAttendees === 'number' ? source.maxAttendees : undefined,
    price: ticketMinPrice,
    isPublished: source.isPublished !== false,
    isActive: source.isActive !== false,
    attendees,
    createdAt: toIsoOrUndefined(source.createdAt) || fallbackStartDate,
    updatedAt: toIsoOrUndefined(source.updatedAt) || fallbackStartDate,
    // Additional fields for component compatibility
    tickets,
    speakers,
    sessions,
    type,
    category: toStringOrUndefined(source.category) || 'General',
    image,
    onlineUrl,
    tags: Array.isArray(source.tags) ? source.tags : [],
    attendeesCount: toNumber(source.totalAttendees ?? source.attendeesCount ?? attendees.length),
    organizerName,
    organizerAvatar,
    communityName: source.community?.name,
    communitySlug: source.community?.slug,
  };
}

/**
 * Transform backend registration data to frontend format
 */
function transformRegistration(backendRegistration: any): EventRegistration {
  const event = backendRegistration.event || backendRegistration;
  const ticket = backendRegistration.ticket || backendRegistration.ticketType;

  return {
    id: String(backendRegistration._id || backendRegistration.id || ''),
    event: transformEvent(event),
    ticket: ticket ? {
      id: String(ticket._id || ticket.id || ticket.type || ''),
      type: ticket.type || 'general',
      name: ticket.name || ticket.type || 'General Admission',
      price: toNumber(ticket.price),
      description: toStringOrUndefined(ticket.description),
      quantity: typeof ticket.quantity === 'number' ? ticket.quantity : undefined,
      sold: toNumber(ticket.sold),
    } : {
      id: 'unknown',
      type: 'general',
      name: 'General Admission',
      price: 0,
    },
    quantity: Math.max(1, toNumber(backendRegistration.quantity, 1)),
    status: backendRegistration.status || 'confirmed',
    registeredAt: toIsoOrUndefined(backendRegistration.registeredAt) ||
      toIsoOrUndefined(backendRegistration.registrationDate) ||
      new Date().toISOString(),
  };
}

export function normalizeEventRegistrations(payload: any): EventRegistration[] {
  const registrationsList = unwrapRegistrationsList(payload);
  if (!Array.isArray(registrationsList) || registrationsList.length === 0) {
    return [];
  }

  return registrationsList
    .map((reg: any) => {
      const looksLikeRegistration =
        Boolean(reg?.event) ||
        Boolean(reg?.ticket) ||
        Boolean(reg?.registeredAt) ||
        Boolean(reg?.registrationDate) ||
        Boolean(reg?.status);

      if (looksLikeRegistration) {
        return transformRegistration(reg);
      }

      const userRegistration = reg?.userRegistration || {
        ticketType: reg?.ticketType || 'general',
        registeredAt: reg?.registeredAt || new Date().toISOString(),
        quantity: reg?.quantity || 1,
        status: reg?.status || 'confirmed',
      };

      const ticket = resolveRegistrationTicket(reg, userRegistration);

      return transformRegistration({
        ...userRegistration,
        id: userRegistration?.id || reg?._id || reg?.id,
        event: reg,
        ticket,
      });
    })
    .filter((registration) => Boolean(registration?.event?.id));
}

/**
 * Events Community API Service
 */
export const eventsCommunityApi = {
  /**
   * Fetch all data needed for events page
   */
  async getEventsPageData(slug: string): Promise<EventsPageData> {
    try {
      const normalisedSlug = decodeURIComponent(slug).trim();

      // First, get the community to get its ID
      const communityResponse = await communitiesApi.getBySlug(normalisedSlug);
      const communityPayload = (communityResponse as any)?.data?.data ?? communityResponse?.data;
      const community = Array.isArray(communityPayload) ? communityPayload[0] : communityPayload;
      const communityId = community?.id ?? community?._id ?? community?.communityId;

      if (!community || !communityId) {
        throw new Error('Community not found');
      }

      // Fetch in parallel
      const [eventsResponse, userRegistrationsResponse, currentUser] = await Promise.allSettled([
        // Get events by community ID - backend endpoint: GET /events/community/:communityId
        apiClient.get<ApiSuccessResponse<{ events: any[] }>>(
          `/events/community/${communityId}`,
          { page: 1, limit: 100, isActive: true, isPublished: true },
        ).catch(() => null),
        // Get user registrations - backend endpoint: GET /events/my-registrations
        apiClient.get<ApiSuccessResponse<{ events: any[] }>>('/events/my-registrations').catch(() => null),
        getMe().catch(() => null),
      ]);

        // Handle events
      let events: EventWithTickets[] = [];
      if (eventsResponse.status === 'fulfilled' && eventsResponse.value) {
        const eventsData = eventsResponse.value as ApiSuccessResponse<{ events: any[] }> | null;
        const eventsList = unwrapEventsList((eventsData as any)?.data);
        events = Array.isArray(eventsList)
          ? eventsList.map(transformEvent)
          : [];
      }

      // Handle user registrations
      let userRegistrations: EventRegistration[] = [];
      if (userRegistrationsResponse.status === 'fulfilled' && userRegistrationsResponse.value) {
        const registrationsData = userRegistrationsResponse.value as ApiSuccessResponse<{ events: any[] }> | null;
        userRegistrations = normalizeEventRegistrations(registrationsData);
      }

      // Transform current user
      const user = currentUser.status === 'fulfilled' && currentUser.value
        ? {
          id: String(currentUser.value._id || currentUser.value.id || ''),
          email: currentUser.value.email || '',
          username: currentUser.value.username || currentUser.value.name || '',
          firstName: currentUser.value.firstName || currentUser.value.name?.split(' ')[0] || undefined,
          lastName: currentUser.value.lastName || currentUser.value.name?.split(' ').slice(1).join(' ') || undefined,
          avatar: currentUser.value.avatar || currentUser.value.profile_picture || undefined,
          bio: currentUser.value.bio || undefined,
          role: currentUser.value.role || 'member',
          verified: currentUser.value.verified || false,
          createdAt: currentUser.value.createdAt || new Date().toISOString(),
          updatedAt: currentUser.value.updatedAt || new Date().toISOString(),
        }
        : null;

      // Mark events as registered if user has registrations
      const registeredEventIds = new Set(userRegistrations.map(r => r.event.id));
      events = events.map(event => ({
        ...event,
        isRegistered: registeredEventIds.has(event.id),
      }));

      return {
        community,
        events,
        userRegistrations,
        currentUser: user,
      };
    } catch (error) {
      console.error('Error fetching events page data:', error);
      throw error;
    }
  },
};


