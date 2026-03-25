import { apiClient } from './client';
import type { LiveSupportMessage, LiveSupportTicket } from './types';

const normalizeTicket = (ticket: any): LiveSupportTicket | null => {
  if (!ticket) return null;
  return {
    ...ticket,
    id: ticket.id || ticket._id,
  } as LiveSupportTicket;
};

const normalizeMessage = (message: any): LiveSupportMessage => ({
  ...message,
  id: message.id || message._id,
  conversationId: message.conversationId?.toString?.() || message.conversationId,
});

export const liveSupportApi = {
  getMyTicket: async (): Promise<{ ticket: LiveSupportTicket | null }> => {
    const res = await apiClient.get<any>('/live-support/me/ticket');
    const root = (res as any)?.data ?? res;
    return { ticket: normalizeTicket(root?.ticket) };
  },

  getMyMessages: async (params?: { cursor?: string; limit?: number }) => {
    const res = await apiClient.get<any>('/live-support/me/ticket/messages', params);
    const root = (res as any)?.data ?? res;
    return {
      ticket: normalizeTicket(root?.ticket),
      messages: (root?.messages || []).map(normalizeMessage),
    };
  },

  sendMyMessage: async (text: string) => {
    const res = await apiClient.post<any>('/live-support/me/message', { text });
    const root = (res as any)?.data ?? res;
    return {
      ticket: normalizeTicket(root?.ticket),
      userMessage: root?.userMessage ? normalizeMessage(root.userMessage) : null,
      aiMessage: root?.aiMessage ? normalizeMessage(root.aiMessage) : null,
    };
  },

  requestAdmin: async (conversationId: string) => {
    const res = await apiClient.post<any>('/live-support/me/request-admin', { conversationId });
    const root = (res as any)?.data ?? res;
    return { ticket: normalizeTicket(root?.ticket) };
  },
};

