import { apiClient } from "./client";

export type AiAgentType =
  | "concierge"
  | "tutor"
  | "challenge_coach"
  | "support"
  | "sales";
export type AiAgentTone = "friendly" | "professional" | "direct" | "coach";
export type AiAgentSurface =
  | "community"
  | "course"
  | "challenge"
  | "checkout"
  | "support";

export interface AiAgent {
  _id: string;
  type: AiAgentType;
  name: string;
  avatarUrl?: string;
  bio?: string;
  tone: AiAgentTone;
  languages: string[];
  enabledSurfaces: AiAgentSurface[];
  status: "active" | "paused";
  stats?: { conversations: number; escalations: number; lastActiveAt?: string };
}

export interface AiAgentPayload {
  type: AiAgentType;
  name: string;
  bio?: string;
  tone?: AiAgentTone;
  languages?: string[];
  enabledSurfaces?: AiAgentSurface[];
  systemPromptOverride?: string;
}

function unwrap<T>(response: any): T {
  return (response?.data?.data ?? response?.data ?? response) as T;
}

export const aiAgentsApi = {
  list: async (communityId: string) =>
    unwrap<AiAgent[]>(
      await apiClient.get(`/communities/${communityId}/ai/agents`),
    ),
  create: async (communityId: string, payload: AiAgentPayload) =>
    unwrap<AiAgent>(
      await apiClient.post(`/communities/${communityId}/ai/agents`, payload),
    ),
  update: async (
    communityId: string,
    agentId: string,
    payload: Partial<AiAgentPayload> & { status?: "active" | "paused" },
  ) =>
    unwrap<AiAgent>(
      await apiClient.patch(
        `/communities/${communityId}/ai/agents/${agentId}`,
        payload,
      ),
    ),
  remove: async (communityId: string, agentId: string) =>
    unwrap<{ success: boolean }>(
      await apiClient.delete(
        `/communities/${communityId}/ai/agents/${agentId}`,
      ),
    ),
  chat: async (
    communityId: string,
    agentId: string,
    message: string,
    conversationId?: string,
  ) =>
    unwrap<{
      conversationId: string;
      answer: string;
      citations: Array<{
        sourceType: string;
        sourceId: string;
        excerpt: string;
      }>;
    }>(
      await apiClient.post(
        `/communities/${communityId}/ai/agents/${agentId}/chat`,
        { message, conversationId },
      ),
    ),
  reindexKnowledge: async (communityId: string) =>
    unwrap<{ indexed: number; status: string }>(
      await apiClient.post(
        `/communities/${communityId}/ai/knowledge/reindex`,
        {},
      ),
    ),
  getKnowledgeStatus: async (communityId: string) =>
    unwrap<{ count: number; status: string; updatedAt: string | null }>(
      await apiClient.get(`/communities/${communityId}/ai/knowledge/status`),
    ),
};

export const aiCofounderApi = {
  buildCommunity: async (payload: {
    niche: string;
    audience: string;
    promise: string;
    price?: number;
    currency?: string;
  }) =>
    unwrap<any>(await apiClient.post("/ai/cofounder/build-community", payload)),
  createLaunchPlan: async (payload: {
    communityId: string;
    durationDays: 7 | 14 | 30;
    goal: string;
  }) => unwrap<any>(await apiClient.post("/ai/cofounder/launch-plan", payload)),
  fixFunnel: async (communityId: string) =>
    unwrap<any>(
      await apiClient.post("/ai/cofounder/fix-funnel", { communityId }),
    ),
  growCommunity: async (communityId: string) =>
    unwrap<any>(await apiClient.post("/ai/cofounder/grow", { communityId })),
  publishDraft: async (payload: {
    draftType: string;
    draftPayload: Record<string, any>;
    confirm: boolean;
  }) =>
    unwrap<any>(await apiClient.post("/ai/cofounder/publish-draft", payload)),
};
