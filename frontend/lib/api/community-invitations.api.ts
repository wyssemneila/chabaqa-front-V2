import { apiClient } from './client';

// ============================================================================
// Type Definitions
// ============================================================================

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface CommunityInvitation {
  _id: string;
  email: string;
  name: string;
  communityId: string;
  creatorId: string;
  token: string;
  status: InvitationStatus;
  personalMessage: string;
  invitedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  acceptedByUserId?: string;
  resendCount: number;
  lastResentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  revoked: number;
  conversionRate: number;
}

export interface ImportContactsResult {
  created: number;
  skipped: number;
  skippedEmails: string[];
}

export interface ContactEntry {
  email: string;
  name?: string;
}

export interface ImportContactsDto {
  contacts: ContactEntry[];
  communityId: string;
  personalMessage?: string;
}

export interface InviteSingleDto {
  email: string;
  name?: string;
  communityId: string;
  personalMessage?: string;
}

export interface InvitationQueryParams {
  page?: number;
  limit?: number;
  status?: 'all' | InvitationStatus;
  search?: string;
}

export interface InvitationListResponse {
  invitations: CommunityInvitation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TokenValidation {
  valid: boolean;
  isExpired: boolean;
  isAccepted: boolean;
  isRevoked: boolean;
  email: string;
  communityId: string;
  communityName: string;
  communitySlug: string;
  communityAvatar: string;
  creatorName: string;
  personalMessage: string;
}

export interface AcceptInvitationResult {
  success: boolean;
  communityId: string;
  communitySlug: string;
}

// ============================================================================
// API Functions
// ============================================================================

const BASE = '/community-invitations';

const unwrapPayload = <T>(raw: any): T => {
  if (raw?.data?.data !== undefined) return raw.data.data as T;
  if (raw?.success !== undefined && raw?.data !== undefined) return raw.data as T;
  if (raw?.data !== undefined && raw?.invitations === undefined && raw?.total === undefined) {
    return raw.data as T;
  }
  return raw as T;
};

const normalizeStats = (payload: any): InvitationStats => ({
  total: Number(payload?.total ?? 0),
  pending: Number(payload?.pending ?? 0),
  accepted: Number(payload?.accepted ?? 0),
  expired: Number(payload?.expired ?? 0),
  revoked: Number(payload?.revoked ?? 0),
  conversionRate: Number(payload?.conversionRate ?? 0),
});

const normalizeInvitationList = (payload: any): InvitationListResponse => ({
  invitations: Array.isArray(payload?.invitations) ? payload.invitations : [],
  total: Number(payload?.total ?? 0),
  page: Number(payload?.page ?? 1),
  limit: Number(payload?.limit ?? 20),
  totalPages: Number(payload?.totalPages ?? 1),
});

export const communityInvitationsApi = {
  // ---- Creator actions ----

  /** Bulk import contacts and send invitation emails */
  importContacts: (dto: ImportContactsDto) =>
    apiClient.post<ImportContactsResult>(`${BASE}/import`, dto),

  /** Invite a single contact */
  inviteSingle: (dto: InviteSingleDto) =>
    apiClient.post<CommunityInvitation>(`${BASE}/single`, dto),

  /** List invitations for a community (paginated + filterable) */
  getInvitations: async (communityId: string, params?: InvitationQueryParams) => {
    const response = await apiClient.get<any>(`${BASE}/${communityId}`, params)
    const payload = unwrapPayload<any>(response)
    return normalizeInvitationList(payload)
  },

  /** Get invitation statistics for a community */
  getStats: async (communityId: string) => {
    const response = await apiClient.get<any>(`${BASE}/${communityId}/stats`)
    const payload = unwrapPayload<any>(response)
    return normalizeStats(payload)
  },

  /** Resend an invitation email */
  resendInvitation: (invitationId: string) =>
    apiClient.post<CommunityInvitation>(`${BASE}/${invitationId}/resend`),

  /** Revoke an invitation */
  revokeInvitation: (invitationId: string) =>
    apiClient.patch<CommunityInvitation>(`${BASE}/${invitationId}/revoke`),

  /** Delete an invitation */
  deleteInvitation: (invitationId: string) =>
    apiClient.delete<void>(`${BASE}/${invitationId}`),

  // ---- Public / Accept flow ----

  /** Validate an invitation token (public, no auth required) */
  validateToken: (token: string) =>
    apiClient.get<TokenValidation>(`${BASE}/accept/${token}`),

  /** Accept an invitation and join the community */
  acceptInvitation: (token: string) =>
    apiClient.post<AcceptInvitationResult>(`${BASE}/accept/${token}`),
};
