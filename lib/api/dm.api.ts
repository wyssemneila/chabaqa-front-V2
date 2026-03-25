import { apiClient } from './client';
import type { Conversation, InboxResponse, MessagesResponse, Message } from './types';

// Import image URL resolver
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const API_ORIGIN = API_BASE.replace(/\/api$/, '');

function resolveImageUrl(value?: string): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  if (!v) return undefined;
  
  // If it's already a full URL
  if (/^https?:\/\//i.test(v)) {
    // Force HTTPS for production
    if (v.startsWith('http://')) {
      // If it's an IP address, use the API domain instead
      if (/^http:\/\/\d+\.\d+\.\d+\.\d+/.test(v)) {
        const path = v.replace(/^http:\/\/[^/]+/, '');
        return `https://api.chabaqa.io${path}`;
      }
      return v.replace('http://', 'https://');
    }
    return v;
  }
  
  if (v.startsWith('/')) {
    if (v.startsWith('/uploads') || v.startsWith('/storage') || v.startsWith('/images')) {
      const secureOrigin = API_ORIGIN.replace('http://', 'https://').replace(/^https?:\/\/\d+\.\d+\.\d+\.\d+:\d+/, 'https://api.chabaqa.io');
      return `${secureOrigin}${v}`;
    }
    return v;
  }
  
  if (v.startsWith('uploads') || v.startsWith('storage') || v.startsWith('images')) {
    const secureOrigin = API_ORIGIN.replace('http://', 'https://').replace(/^https?:\/\/\d+\.\d+\.\d+\.\d+:\d+/, 'https://api.chabaqa.io');
    return `${secureOrigin}/${v.replace(/^\/+/, '')}`;
  }
  
  if (v && !v.includes('://')) {
    const secureOrigin = API_ORIGIN.replace('http://', 'https://').replace(/^https?:\/\/\d+\.\d+\.\d+\.\d+:\d+/, 'https://api.chabaqa.io');
    return `${secureOrigin}/uploads/image/${v}`;
  }
  
  return undefined;
}

function normalizeUserPhoto(user: any): any {
  if (!user || typeof user === 'string') return user;
  const rawAvatar = user.avatar || user.photo_profil || user.profile_picture || user.photo || user.image;
  const resolved = resolveImageUrl(rawAvatar);
  return {
    ...user,
    avatar: resolved || undefined,
    photo_profil: resolveImageUrl(user.photo_profil) || undefined,
    profile_picture: resolveImageUrl(user.profile_picture) || undefined,
    photo: resolveImageUrl(user.photo) || undefined,
  };
}

type ConversationId = string;

const withId = <T extends { _id?: string; id?: string }>(obj: T): T & { id: string } => {
  if (!obj || typeof obj !== 'object') return { id: '' } as any;
  const id = ((obj as any).id || (obj as any)._id || '') as string;
  return { ...(obj as any), id };
};

const extractConversationPayload = (res: any) => {
  const root = res?.conversation ?? res?.data?.conversation ?? res?.data ?? res;
  return root?.conversation ?? root;
};

const extractMessagePayload = (res: any) => {
  const root = res?.message ?? res?.data?.message ?? res?.data ?? res;
  return root?.message ?? root;
};

const normalizeParticipant = (p: any): any => {
  if (!p) return null;
  if (typeof p === 'string') return p;
  // Populated user object — keep all fields, ensure `id` exists, resolve photos
  return normalizeUserPhoto({ ...p, id: p._id || p.id || '' });
};

const normalizeMessage = (m: any): Message => {
  if (!m) return { id: '', attachments: [] } as any;
  // Handle Mongoose document wrapper
  const raw = m._doc || m;
  const msg = withId(raw);
  // Keep populated sender/recipient objects, extract string id separately
  const senderObj = typeof raw.senderId === 'object' && raw.senderId ? { ...raw.senderId, id: raw.senderId._id?.toString?.() || raw.senderId.id || '' } : undefined;
  const senderId = senderObj ? senderObj.id : (raw.senderId?.toString?.() || raw.senderId || '');
  const recipientId = typeof raw.recipientId === 'object' && raw.recipientId
    ? (raw.recipientId._id?.toString?.() || raw.recipientId.id || '')
    : (raw.recipientId?.toString?.() || raw.recipientId || '');
  const normalizedAttachments = (raw.attachments || []).map((att: any) => ({
    ...att,
    url: resolveImageUrl(att.url) || att.url
  }));

  return {
    ...msg,
    conversationId: raw.conversationId?.toString?.() || raw.conversationId,
    senderId,
    recipientId,
    text: raw.text || '',
    sender: senderObj || raw.sender,
    attachments: normalizedAttachments,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  } as Message;
};

const normalizeConversation = (c: any): Conversation => {
  if (!c) return { id: '', type: 'PEER_DM', unreadCountA: 0, unreadCountB: 0, isOpen: true } as any;
  const conv = withId(c);
  return {
    ...conv,
    participantA: normalizeParticipant(conv.participantA),
    participantB: normalizeParticipant(conv.participantB),
    communityId: typeof conv.communityId === 'object' && conv.communityId
      ? { ...conv.communityId, id: conv.communityId._id || conv.communityId.id || '' }
      : (conv.communityId || ''),
    createdAt: conv.createdAt || new Date().toISOString(),
    updatedAt: conv.updatedAt || new Date().toISOString(),
  } as Conversation;
};

export const dmApi = {
  startCommunityConversation: async (communityId: string): Promise<{ conversation: Conversation }> => {
    const res = await apiClient.post<any>('/dm/community/start', { communityId });
    const conv = extractConversationPayload(res);
    return { conversation: normalizeConversation(conv) };
  },

  startPeerConversation: async (communityId: string, targetUserId: string): Promise<{ conversation: Conversation }> => {
    const res = await apiClient.post<any>('/dm/peer/start', { communityId, targetUserId });
    const conv = extractConversationPayload(res);
    console.log('[DM API] startPeerConversation response:', { res, conv });
    return { conversation: normalizeConversation(conv) };
  },

  startSessionConversation: async (bookingId: string): Promise<{ conversation: Conversation }> => {
    const res = await apiClient.post<any>('/dm/session/start', { bookingId });
    const conv = extractConversationPayload(res);
    return { conversation: normalizeConversation(conv) };
  },

  startHelpConversation: async (): Promise<{ conversation: Conversation }> => {
    const res = await apiClient.post<any>('/dm/help/start');
    const conv = extractConversationPayload(res);
    return { conversation: normalizeConversation(conv) };
  },

  listInbox: async (params?: { type?: 'community' | 'help' | 'peer' | 'session'; page?: number; limit?: number }): Promise<InboxResponse> => {
    const res = await apiClient.get<any>('/dm/inbox', params);
    // Handle response wrapped in { success, data } structure
    const data = res?.data ?? res;
    return {
      ...data,
      conversations: (data.conversations || []).map(normalizeConversation),
    } as InboxResponse;
  },

  listMessages: async (conversationId: ConversationId, params?: { page?: number; limit?: number }): Promise<MessagesResponse> => {
    const res = await apiClient.get<any>(`/dm/${conversationId}/messages`, params);
    const root = (res as any)?.data ?? res;
    return {
      ...root,
      conversation: normalizeConversation(root.conversation),
      messages: (root.messages || []).map(normalizeMessage),
    } as MessagesResponse;
  },

  sendMessage: async (
    conversationId: ConversationId,
    payload: { text?: string; attachments?: { url: string; type: 'image' | 'file' | 'video'; size: number }[] }
  ): Promise<{ message: Message }> => {
    const res = await apiClient.post<any>(`/dm/${conversationId}/messages`, payload);
    const msg = extractMessagePayload(res);
    return { message: normalizeMessage(msg) };
  },

  uploadAttachment: async (conversationId: ConversationId, file: File): Promise<{ message: Message }> => {
    const res = await apiClient.uploadFile<any>(`/dm/${conversationId}/attachments`, file, 'file');
    const msg = extractMessagePayload(res);
    return { message: normalizeMessage(msg) };
  },

  markRead: async (conversationId: ConversationId): Promise<{ ok: boolean; readAt: string }> => {
    return apiClient.patch<{ ok: boolean; readAt: string }>(`/dm/${conversationId}/read`);
  },

  helpQueue: async (): Promise<{ items: Conversation[] }> => {
    const res = await apiClient.get<{ items: any[] }>('/dm/help/queue');
    return { items: (res.items || []).map(normalizeConversation) };
  },

  assignHelp: async (conversationId: ConversationId): Promise<{ conversation: Conversation }> => {
    const res = await apiClient.patch<{ conversation: any }>(`/dm/help/${conversationId}/assign`);
    if ((res as any)?.conversation) {
      return { conversation: normalizeConversation((res as any).conversation) };
    }
    return { conversation: normalizeConversation(res as any) };
  },

  getHelpAdmin: async (conversationId: ConversationId): Promise<{ admin: any }> => {
    return apiClient.get<{ admin: any }>(`/dm/${conversationId}/admin`);
  },
};
