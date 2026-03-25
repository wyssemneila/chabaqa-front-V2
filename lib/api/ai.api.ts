import { apiClient } from './client';

export interface AskChapterQuestionResponse {
  answer: string;
  chapterId: string;
  model?: string;
}

export interface ChapterHistoryMessage {
  role: 'user' | 'ai';
  content: string;
  createdAt?: string | null;
}

export interface ChapterHistoryResponse {
  courseId: string;
  chapterId: string;
  messages: ChapterHistoryMessage[];
}

export const aiApi = {
  askChapterQuestion: async (courseId: string, chapterId: string, question: string) => {
    const response = await apiClient.post<any>(
      `/ai/courses/${courseId}/chapters/${chapterId}/ask`,
      { question }
    );

    const payload = response?.data && typeof response.data === 'object'
      ? response.data
      : response;
    const answer =
      typeof payload?.answer === 'string'
        ? payload.answer.trim()
        : '';

    if (!answer) {
      throw new Error('AI returned an empty response');
    }

    return {
      answer,
      chapterId: String(payload?.chapterId || chapterId),
      model: typeof payload?.model === 'string' ? payload.model : undefined,
    } as AskChapterQuestionResponse;
  },

  getChapterHistory: async (courseId: string, chapterId: string) => {
    const response = await apiClient.get<any>(
      `/ai/courses/${courseId}/chapters/${chapterId}/history`,
    );
    const payload = response?.data && typeof response.data === 'object'
      ? response.data
      : response;
    const rawMessages = Array.isArray(payload?.messages) ? payload.messages : [];

    return {
      courseId: String(payload?.courseId || courseId),
      chapterId: String(payload?.chapterId || chapterId),
      messages: rawMessages
        .map((message: any) => ({
          role: message?.role === 'user' ? 'user' : 'ai',
          content: typeof message?.content === 'string' ? message.content.trim() : '',
          createdAt: message?.createdAt || null,
        }))
        .filter((message: ChapterHistoryMessage) => message.content.length > 0),
    } as ChapterHistoryResponse;
  },
};
