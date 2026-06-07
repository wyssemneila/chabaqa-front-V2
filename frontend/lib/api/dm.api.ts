import { apiClient } from './client';
import type { Conversation, InboxResponse, Message, MessageSearchResponse, MessagesResponse } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const API_ORIGIN = API_BASE.replace(/\/api$/, '');

function resolveImageUrl(value?: string): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  if (!v) return undefined;

  if (/^https?:\/\//i.test(v)) {
    if (v.startsWith('http://')) {
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
      const secureOrigin = API_ORIGIN
        .replace('http://', 'https://')
        .replace(/^https?:\/\/\d+\.\d+\.\d+\.\d+:\d+/, 'https://api.chabaqa.io');
      return `${secureOrigin}${v}`;
    }
    return v;
  }

  if (v.startsWith('uploads') || v.startsWith('storage') || v.startsWith('images')) {
    const secureOrigin = API_ORIGIN
      .replace('http://', 'https://')
      .replace(/^https?:\/\/\d+\.\d+\.\d+\.\d+:\d+/, 'https://api.chabaqa.io');
    return `${secureOrigin}/${v.replace(/^\/+/, '')}`;
  }

  if (v && !v.includes('://')) {
    const secureOrigin = API_ORIGIN
      .replace('http://', 'https://')
      .replace(/^https?:\/\/\d+\.\d+\.\d+\.\d+:\d+/, 'https://api.chabaqa.io');
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
    id: user._id?.toString?.() || user.id || '',
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

const normalizeUserId = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id?.toString?.() || value.id || value.toString?.() || '';
};

const normalizeParticipant = (p: any): any => {
  if (!p) return null;
  if (typeof p === 'string') return p;
  return normalizeUserPhoto({ ...p, id: p._id?.toString?.() || p.id || '' });
};

const normalizeReaction = (reaction: any, myId?: string) => {
  const userIds = (reaction?.userIds || []).map(normalizeUserId).filter(Boolean);
  return {
    ...reaction,
    userIds,
    count: userIds.length,
    usersIncludeMe: myId ? userIds.includes(myId) : reaction?.usersIncludeMe,
  };
};

const normalizeReplyMessage = (value: any): Message | string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  const raw = value._doc || value;
  const msg = withId(raw);
  const senderObj = typeof raw.senderId === 'object' && raw.senderId
    ? normalizeParticipant(raw.senderId)
    : undefined;
  const senderId = senderObj ? senderObj.id : normalizeUserId(raw.senderId);
  const normalizedAttachments = (raw.attachments || []).map((att: any) => ({
    ...att,
    url: resolveImageUrl(att.url) || att.url,
  }));

  return {
    ...msg,
    conversationId: normalizeUserId(raw.conversationId),
    senderId,
    recipientId: normalizeUserId(raw.recipientId),
    text: raw.deletedAt ? '' : (raw.text || ''),
    sender: senderObj || normalizeParticipant(raw.sender),
    attachments: raw.deletedAt ? [] : normalizedAttachments,
    reactions: (raw.reactions || []).map((reaction: any) => normalizeReaction(reaction)),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
  } as Message;
};

const normalizeMessage = (m: any): Message => {
  if (!m) return { id: '', attachments: [] } as any;
  const raw = m._doc || m;
  const msg = withId(raw);
  const senderObj = typeof raw.senderId === 'object' && raw.senderId
    ? normalizeParticipant(raw.senderId)
    : undefined;
  const recipientObj = typeof raw.recipientId === 'object' && raw.recipientId
    ? normalizeParticipant(raw.recipientId)
    : undefined;
  const senderId = senderObj ? senderObj.id : normalizeUserId(raw.senderId);
  const recipientId = recipientObj ? recipientObj.id : normalizeUserId(raw.recipientId);
  const normalizedAttachments = (raw.attachments || []).map((att: any) => ({
    ...att,
    url: resolveImageUrl(att.url) || att.url,
  }));

  return {
    ...msg,
    conversationId: normalizeUserId(raw.conversationId),
    senderId,
    recipientId,
    text: raw.text || '',
    sender: senderObj || normalizeParticipant(raw.sender),
    recipient: recipientObj || normalizeParticipant(raw.recipient),
    replyToMessageId: normalizeReplyMessage(raw.replyToMessageId),
    attachments: normalizedAttachments,
    reactions: (raw.reactions || []).map((reaction: any) => normalizeReaction(reaction)),
    editHistory: (raw.editHistory || []).map((entry: any) => ({
      ...entry,
      editedBy: typeof entry.editedBy === 'object' ? normalizeParticipant(entry.editedBy) : normalizeUserId(entry.editedBy),
      editedAt: entry.editedAt || raw.editedAt || new Date().toISOString(),
    })),
    editedBy: typeof raw.editedBy === 'object' ? normalizeParticipant(raw.editedBy) : normalizeUserId(raw.editedBy),
    deletedBy: typeof raw.deletedBy === 'object' ? normalizeParticipant(raw.deletedBy) : normalizeUserId(raw.deletedBy),
    pinnedBy: typeof raw.pinnedBy === 'object' ? normalizeParticipant(raw.pinnedBy) : normalizeUserId(raw.pinnedBy),
    deletedFor: (raw.deletedFor || []).map(normalizeUserId).filter(Boolean),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
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
    payload: {
      text?: string;
      attachments?: {
        url: string;
        type: 'image' | 'file' | 'video';
        size: number;
        name?: string;
        mimeType?: string;
        width?: number;
        height?: number;
      }[];
      replyToMessageId?: string;
      clientRequestId?: string;
    }
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

  searchMessages: async (
    conversationId: ConversationId,
    params: { q: string; page?: number; limit?: number }
  ): Promise<MessageSearchResponse> => {
    const res = await apiClient.get<any>(`/dm/${conversationId}/messages/search`, params);
    const root = (res as any)?.data ?? res;
    return {
      ...root,
      messages: (root.messages || []).map(normalizeMessage),
    } as MessageSearchResponse;
  },

  listPinnedMessages: async (conversationId: ConversationId): Promise<{ messages: Message[] }> => {
    const res = await apiClient.get<any>(`/dm/${conversationId}/messages/pinned`);
    const root = (res as any)?.data ?? res;
    return { messages: (root.messages || []).map(normalizeMessage) };
  },

  editMessage: async (conversationId: ConversationId, messageId: string, text: string): Promise<{ message: Message }> => {
    const res = await apiClient.patch<any>(`/dm/${conversationId}/messages/${messageId}`, { text });
    const msg = extractMessagePayload(res);
    return { message: normalizeMessage(msg) };
  },

  deleteMessage: async (
    conversationId: ConversationId,
    messageId: string,
    scope: 'me' | 'everyone' = 'me',
  ): Promise<{ ok: boolean; messageId: string; scope: 'me' | 'everyone' }> => {
    return apiClient.delete<{ ok: boolean; messageId: string; scope: 'me' | 'everyone' }>(
      `/dm/${conversationId}/messages/${messageId}?scope=${encodeURIComponent(scope)}`,
    );
  },

  reactToMessage: async (
    conversationId: ConversationId,
    messageId: string,
    emoji: string,
  ): Promise<{ messageId: string; reactions: Message['reactions'] }> => {
    const res = await apiClient.post<any>(`/dm/${conversationId}/messages/${messageId}/reactions`, { emoji });
    const root = (res as any)?.data ?? res;
    return {
      messageId: root.messageId,
      reactions: (root.reactions || []).map((reaction: any) => normalizeReaction(reaction)),
    };
  },

  pinMessage: async (conversationId: ConversationId, messageId: string, pinned: boolean): Promise<{ message: Message }> => {
    const res = await apiClient.patch<any>(`/dm/${conversationId}/messages/${messageId}/pin`, { pinned });
    const msg = extractMessagePayload(res);
    return { message: normalizeMessage(msg) };
  },

  typing: async (conversationId: ConversationId, isTyping: boolean): Promise<{ ok: boolean }> => {
    return apiClient.post<{ ok: boolean }>(`/dm/${conversationId}/typing`, { isTyping });
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
