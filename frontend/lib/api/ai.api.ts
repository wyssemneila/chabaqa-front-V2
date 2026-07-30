import { apiClient } from "./client";

export type AiTutorMode = "chat" | "summary" | "quiz" | "simplify";

export type TutorSource = {
  id: string;
  label: string;
  excerpt: string;
};

export type TutorQuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceId?: string;
};

export type ChapterHistoryMessage = {
  role: "user" | "ai";
  content: string;
  createdAt?: string | null;
  mode?: AiTutorMode | string | null;
  intent?: string | null;
  sources?: TutorSource[];
  metadata?: {
    questionCount?: number;
    quizId?: string;
    questions?: TutorQuizQuestion[];
  } | null;
  quiz?: TutorQuizQuestion[];
};

export type ChapterHistoryResponse = {
  courseId: string;
  chapterId: string;
  messages: ChapterHistoryMessage[];
};

export type ChatAskResponse = {
  mode: "chat";
  answer: string;
  sources: TutorSource[];
  intent?: string;
  chapterId: string;
  model?: string;
};

export type SummaryAskResponse = {
  mode: "summary";
  summary: string;
  keyPoints: string[];
  sources: TutorSource[];
  chapterId: string;
  model?: string;
};

export type QuizAskResponse = {
  mode: "quiz";
  questions: TutorQuizQuestion[];
  chapterId: string;
  model?: string;
};

export type SimplifyAskResponse = {
  mode: "simplify";
  answer: string;
  sources: TutorSource[];
  chapterId: string;
  model?: string;
};

export type LearnerProfile = {
  _id?: string;
  userId?: string;
  skillLevel: string;
  goals: string;
  preferredLearningStyle: string;
  weakTopics: string[];
  interests: string[];
  preferredLanguage: string;
};

export type LearnerProfileInput = {
  skillLevel?: string;
  goals?: string;
  preferredLearningStyle?: string;
  weakTopics?: string[];
  interests?: string[];
  preferredLanguage?: string;
};

export type AskChapterResponse =
  | ChatAskResponse
  | SummaryAskResponse
  | QuizAskResponse
  | SimplifyAskResponse;

export type TutorChapterInsight = {
  chapterId: string;
  chapterTitle: string;
  sectionTitle: string;
  totalQuestions: number;
  uniqueLearners: number;
  topQuestions: Array<{ text: string; count: number }>;
  intents: Record<string, number>;
  lastActivityAt: string | null;
  isConfusing: boolean;
};

export type TutorCourseInsights = {
  courseId: string;
  chapters: TutorChapterInsight[];
};

export interface AiSettings {
  courseTutorEnabled: boolean;
  supportAgentEnabled: boolean;
  learningPathsEnabled: boolean;
  providerOverride: string;
}

export type AskChapterPayload = {
  question?: string;
  mode?: AiTutorMode;
};

function unwrapPayload<T>(response: any): T {
  const candidates = [response?.data?.data, response?.data, response];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    if (
      "mode" in candidate ||
      "questions" in candidate ||
      "answer" in candidate ||
      "summary" in candidate ||
      "messages" in candidate
    ) {
      return candidate as T;
    }
  }
  return (response?.data?.data ?? response?.data ?? response) as T;
}

export function normalizeQuizQuestions(raw: unknown): TutorQuizQuestion[] {
  if (!Array.isArray(raw)) return [];
  const normalized: TutorQuizQuestion[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const question = String(
      row.question ?? row.prompt ?? row.text ?? "",
    ).trim();
    const optionSource = row.options ?? row.choices ?? row.answers;
    const options = Array.isArray(optionSource)
      ? optionSource
          .map((opt) => {
            if (typeof opt === "string") return opt.trim();
            if (opt && typeof opt === "object") {
              const obj = opt as Record<string, unknown>;
              return String(
                obj.text ?? obj.label ?? obj.value ?? obj.option ?? "",
              ).trim();
            }
            return "";
          })
          .filter(Boolean)
      : [];
    let correctIndex = Number(
      row.correctIndex ?? row.correct_answer ?? row.answer,
    );
    if (
      Number.isInteger(correctIndex) &&
      correctIndex >= 1 &&
      correctIndex <= options.length
    ) {
      correctIndex -= 1;
    }
    const explanation = String(
      row.explanation ?? row.rationale ?? row.feedback ?? "",
    ).trim();
    if (!question || options.length < 2) continue;
    if (
      !Number.isInteger(correctIndex) ||
      correctIndex < 0 ||
      correctIndex >= options.length
    ) {
      continue;
    }
    normalized.push({
      question,
      options,
      correctIndex,
      explanation,
      ...(row.sourceId || row.source_id
        ? { sourceId: String(row.sourceId ?? row.source_id) }
        : {}),
    });
  }

  return normalized;
}

function historyMessageToUi(message: {
  role: string;
  content: string;
  createdAt?: string | null;
  mode?: string | null;
  intent?: string | null;
  sources?: TutorSource[];
  metadata?: ChapterHistoryMessage["metadata"];
}): ChapterHistoryMessage {
  const base: ChapterHistoryMessage = {
    role: message.role === "user" ? "user" : "ai",
    content: message.content,
    createdAt: message.createdAt || null,
    mode: (message.mode as AiTutorMode) || null,
    intent: message.intent || null,
    sources: message.sources || [],
    metadata: message.metadata || null,
  };

  if (base.mode === "quiz") {
    const quiz = normalizeQuizQuestions(message.metadata?.questions);
    if (quiz.length) {
      return { ...base, quiz };
    }
  }

  return base;
}

function normalizeAskResponse(
  payload: any,
  chapterId: string,
): AskChapterResponse {
  const mode =
    payload?.mode ||
    (Array.isArray(payload?.questions) && payload.questions.length > 0
      ? "quiz"
      : "chat");
  if (mode === "summary") {
    return {
      mode: "summary",
      summary: String(payload?.summary || "").trim(),
      keyPoints: Array.isArray(payload?.keyPoints) ? payload.keyPoints : [],
      sources: Array.isArray(payload?.sources) ? payload.sources : [],
      chapterId: String(payload?.chapterId || chapterId),
      model: payload?.model,
    };
  }
  if (mode === "quiz") {
    const questions = normalizeQuizQuestions(payload?.questions);
    if (!questions.length) {
      throw new Error("AI returned an empty quiz");
    }
    return {
      mode: "quiz",
      questions,
      chapterId: String(payload?.chapterId || chapterId),
      model: payload?.model,
    };
  }
  if (mode === "simplify") {
    return {
      mode: "simplify",
      answer: String(payload?.answer || "").trim(),
      sources: Array.isArray(payload?.sources) ? payload.sources : [],
      chapterId: String(payload?.chapterId || chapterId),
      model: payload?.model,
    };
  }
  const answer = String(payload?.answer || "").trim();
  if (!answer) throw new Error("AI returned an empty response");
  return {
    mode: "chat",
    answer,
    sources: Array.isArray(payload?.sources) ? payload.sources : [],
    intent: payload?.intent,
    chapterId: String(payload?.chapterId || chapterId),
    model: payload?.model,
  };
}

export const aiApi = {
  askChapterQuestion: async (
    courseId: string,
    chapterId: string,
    payload: AskChapterPayload | string,
  ): Promise<AskChapterResponse> => {
    const body =
      typeof payload === "string"
        ? { question: payload, mode: "chat" as const }
        : payload;

    const response = await apiClient.post<any>(
      `/ai/courses/${courseId}/chapters/${chapterId}/ask`,
      body,
    );
    const raw = unwrapPayload<any>(response);
    return normalizeAskResponse(raw, chapterId);
  },

  getChapterHistory: async (courseId: string, chapterId: string) => {
    const response = await apiClient.get<any>(
      `/ai/courses/${courseId}/chapters/${chapterId}/history`,
    );
    const payload = unwrapPayload<any>(response);
    const rawMessages = Array.isArray(payload?.messages)
      ? payload.messages
      : [];

    return {
      courseId: String(payload?.courseId || courseId),
      chapterId: String(payload?.chapterId || chapterId),
      messages: rawMessages
        .map((message: any) =>
          historyMessageToUi({
            role: message?.role === "user" ? "user" : "ai",
            content:
              typeof message?.content === "string"
                ? message.content.trim()
                : "",
            createdAt: message?.createdAt || null,
            mode: message?.mode || null,
            intent: message?.intent || null,
            sources: Array.isArray(message?.sources) ? message.sources : [],
            metadata: message?.metadata || null,
          }),
        )
        .filter((message: ChapterHistoryMessage) => message.content.length > 0),
    } as ChapterHistoryResponse;
  },

  getCourseTutorInsights: async (courseId: string) => {
    const response = await apiClient.get<any>(
      `/ai/courses/${courseId}/tutor-insights`,
    );
    return unwrapPayload<TutorCourseInsights>(response);
  },

  updateCourseTutorSettings: async (
    courseId: string,
    aiTutorEnabled: boolean,
  ) => {
    const response = await apiClient.patch<any>(
      `/ai/courses/${courseId}/settings`,
      { aiTutorEnabled },
    );
    return unwrapPayload<{ courseId: string; aiTutorEnabled: boolean }>(
      response,
    );
  },

  updateChapterTutorSettings: async (
    courseId: string,
    chapterId: string,
    aiTutorEnabled: boolean,
  ) => {
    const response = await apiClient.patch<any>(
      `/ai/courses/${courseId}/chapters/${chapterId}/settings`,
      { aiTutorEnabled },
    );
    return unwrapPayload<{
      courseId: string;
      chapterId: string;
      aiTutorEnabled: boolean;
    }>(response);
  },

  getSettings: async (communityId: string) => {
    const response = await apiClient.get<any>(
      `/communities/${communityId}/ai/settings`,
    );
    return unwrapPayload<AiSettings>(response);
  },

  updateSettings: async (
    communityId: string,
    settings: Partial<AiSettings>,
  ) => {
    const response = await apiClient.patch<any>(
      `/communities/${communityId}/ai/settings`,
      settings,
    );
    return unwrapPayload<AiSettings>(response);
  },

  getLearnerProfile: async () => {
    const response = await apiClient.get<any>("/ai/learner-profile");
    return unwrapPayload<LearnerProfile>(response);
  },

  updateLearnerProfile: async (payload: Partial<LearnerProfileInput>) => {
    const response = await apiClient.patch<any>("/ai/learner-profile", payload);
    return unwrapPayload<LearnerProfile>(response);
  },
};
