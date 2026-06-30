import { apiClient } from "./client";

export type WhatsappSessionStatus =
    | "not_created"
    | "starting"
    | "qr_pending"
    | "pairing_pending"
    | "ready"
    | "disconnected"
    | "failed"
    | "revoked";

export type WhatsappMessageType = "text" | "image" | "video" | "document";
export type WhatsappCampaignStatus =
    | "draft"
    | "scheduled"
    | "sending"
    | "sent"
    | "failed"
    | "cancelled";
export type WhatsappAutomationTrigger =
    | "COMMUNITY_JOIN"
    | "PURCHASE_COMPLETED"
    | "COURSE_ENROLLED"
    | "COURSE_COMPLETED"
    | "CHALLENGE_JOINED"
    | "EVENT_REGISTERED"
    | "INACTIVE_7_DAYS"
    | "INACTIVE_30_DAYS";
export type WhatsappAudienceType =
    | "all_members"
    | "paid_members"
    | "free_members"
    | "course_enrolled"
    | "challenge_participants"
    | "event_registrants"
    | "inactive_users"
    | "custom";

export interface WhatsappSession {
    _id: string;
    communityId: string;
    creatorId: string;
    openwaSessionId?: string;
    name: string;
    phone?: string;
    pushName?: string;
    status: WhatsappSessionStatus;
    qrCodeData?: string;
    pairingCode?: string;
    lastSyncedAt?: string;
    lastError?: string;
}

export interface WhatsappContact {
    _id: string;
    name: string;
    phoneE164: string;
    waChatId: string;
    consentStatus: "opted_in" | "opted_out" | "unknown";
    consentSource?: string;
    consentProof?: string;
    consentMethod?: string;
    consentCapturedAt?: string;
    optOutAt?: string;
    tags?: string[];
}

export interface WhatsappHealth {
    enabled: boolean;
    openwa?: {
        enabled: boolean;
        reachable: boolean;
        authenticated: boolean;
        message?: string;
    };
    sessions?: Record<string, number>;
}

export interface WhatsappRecipient {
    userId?: string;
    contactId: string;
    phoneE164: string;
    waChatId: string;
    status:
        | "pending"
        | "queued"
        | "sent"
        | "delivered"
        | "read"
        | "replied"
        | "failed"
        | "skipped";
    openwaMessageId?: string;
    errorMessage?: string;
}

export interface WhatsappCampaign {
    _id: string;
    title: string;
    communityId: string;
    messageType: WhatsappMessageType;
    body: string;
    caption?: string;
    mediaUrl?: string;
    targetAudience: WhatsappAudienceType;
    status: WhatsappCampaignStatus;
    scheduledAt?: string;
    sentAt?: string;
    recipients?: WhatsappRecipient[];
    totalRecipients: number;
    sentCount: number;
    deliveredCount: number;
    readCount: number;
    repliedCount: number;
    failedCount: number;
    createdAt: string;
}

export interface WhatsappStats {
    campaigns: number;
    recipients: number;
    sent: number;
    delivered: number;
    read: number;
    replied: number;
    failed: number;
    remainingQuota: number;
}

export interface WhatsappAutomation {
    _id: string;
    communityId: string;
    creatorId: string;
    name: string;
    trigger: WhatsappAutomationTrigger;
    delayHours: number;
    messageType: WhatsappMessageType;
    body: string;
    caption?: string;
    isActive: boolean;
    triggeredCount: number;
    createdAt?: string;
}

export interface WhatsappAudiencePreview {
    total: number;
    eligible: number;
    skipped: number;
    remainingQuota: number;
    canSend: boolean;
    contacts: Array<{
        id: string;
        name: string;
        phoneE164: string;
        consentStatus: string;
    }>;
}

export interface CreateWhatsappCampaignDto {
    title: string;
    communityId: string;
    messageType?: WhatsappMessageType;
    body: string;
    caption?: string;
    mediaUrl?: string;
    targetAudience?: WhatsappAudienceType;
    customAudienceIds?: string[];
    scheduledAt?: string;
}

export interface ImportWhatsappContactPayload {
    name: string;
    phoneE164: string;
    optIn?: boolean;
    tags?: string[];
    consentSource?: string;
    consentProof?: string;
    consentMethod?: string;
}

function unwrapData<T>(response: any): T {
    if (
        response &&
        typeof response === "object" &&
        "success" in response &&
        "data" in response
    ) {
        return response.data as T;
    }
    if (response?.data?.data !== undefined) return response.data.data as T;
    if (response?.data !== undefined && response?.success !== undefined)
        return response.data as T;
    return response as T;
}

export const whatsappApi = {
    async getHealth(communityId: string): Promise<WhatsappHealth> {
        return unwrapData(
            await apiClient.get(`/whatsapp/community/${communityId}/health`),
        );
    },

    async getSession(communityId: string): Promise<WhatsappSession | null> {
        return unwrapData(
            await apiClient.get(`/whatsapp/community/${communityId}/session`),
        );
    },

    async createSession(
        communityId: string,
        name?: string,
    ): Promise<WhatsappSession> {
        return unwrapData(
            await apiClient.post(`/whatsapp/community/${communityId}/session`, {
                name,
            }),
        );
    },

    async startSession(communityId: string): Promise<WhatsappSession> {
        return unwrapData(
            await apiClient.post(
                `/whatsapp/community/${communityId}/session/start`,
            ),
        );
    },

    async getQr(
        communityId: string,
    ): Promise<{ session: WhatsappSession; qrCodeData?: string }> {
        return unwrapData(
            await apiClient.get(
                `/whatsapp/community/${communityId}/session/qr`,
            ),
        );
    },

    async requestPairingCode(
        communityId: string,
        phoneNumber: string,
    ): Promise<WhatsappSession> {
        return unwrapData(
            await apiClient.post(
                `/whatsapp/community/${communityId}/session/pairing-code`,
                { phoneNumber },
            ),
        );
    },

    async disconnect(communityId: string): Promise<WhatsappSession> {
        return unwrapData(
            await apiClient.post(
                `/whatsapp/community/${communityId}/session/disconnect`,
            ),
        );
    },

    async sendTestMessage(
        communityId: string,
        phoneE164: string,
        body: string,
    ): Promise<any> {
        return unwrapData(
            await apiClient.post(
                `/whatsapp/community/${communityId}/test-message`,
                { phoneE164, body },
            ),
        );
    },

    async listContacts(
        communityId: string,
    ): Promise<{ contacts: WhatsappContact[] }> {
        return unwrapData(
            await apiClient.get(
                `/whatsapp-campaigns/community/${communityId}/contacts`,
            ),
        );
    },

    async importContacts(
        communityId: string,
        contacts: ImportWhatsappContactPayload[],
    ): Promise<{ contacts: WhatsappContact[] }> {
        return unwrapData(
            await apiClient.post(
                `/whatsapp-campaigns/community/${communityId}/contacts/import`,
                { contacts },
            ),
        );
    },

    async optOutContact(
        communityId: string,
        contactId: string,
    ): Promise<WhatsappContact> {
        return unwrapData(
            await apiClient.post(
                `/whatsapp-campaigns/community/${communityId}/contacts/${contactId}/opt-out`,
            ),
        );
    },

    async previewAudience(
        communityId: string,
        targetAudience: WhatsappAudienceType,
        customAudienceIds: string[] = [],
    ): Promise<WhatsappAudiencePreview> {
        return unwrapData(
            await apiClient.post(
                `/whatsapp-campaigns/community/${communityId}/audience/preview`,
                {
                    targetAudience,
                    customAudienceIds,
                    limit: 20,
                },
            ),
        );
    },

    async listCampaigns(
        communityId: string,
        params: { page?: number; limit?: number; status?: string } = {},
    ): Promise<{
        campaigns: WhatsappCampaign[];
        total: number;
        page: number;
        limit: number;
    }> {
        return unwrapData(
            await apiClient.get(
                `/whatsapp-campaigns/community/${communityId}`,
                params,
            ),
        );
    },

    async getStats(communityId: string): Promise<WhatsappStats> {
        return unwrapData(
            await apiClient.get(
                `/whatsapp-campaigns/community/${communityId}/stats`,
            ),
        );
    },

    async createCampaign(
        data: CreateWhatsappCampaignDto,
    ): Promise<WhatsappCampaign> {
        return unwrapData(await apiClient.post("/whatsapp-campaigns", data));
    },

    async sendCampaign(
        campaignId: string,
    ): Promise<{ message: string; campaignId: string; queued: true }> {
        return unwrapData(
            await apiClient.post(`/whatsapp-campaigns/${campaignId}/send`),
        );
    },

    async cancelCampaign(
        campaignId: string,
    ): Promise<{ message: string; campaignId: string }> {
        return unwrapData(
            await apiClient.post(`/whatsapp-campaigns/${campaignId}/cancel`),
        );
    },

    async deleteCampaign(campaignId: string): Promise<{ deleted: true }> {
        return unwrapData(
            await apiClient.delete(`/whatsapp-campaigns/${campaignId}`),
        );
    },

    async listAutomations(
        communityId: string,
    ): Promise<{ automations: WhatsappAutomation[] }> {
        return unwrapData(
            await apiClient.get(
                `/whatsapp-campaigns/community/${communityId}/automations`,
            ),
        );
    },

    async createAutomation(
        communityId: string,
        data: {
            name: string;
            trigger: WhatsappAutomationTrigger;
            delayHours?: number;
            body: string;
            messageType?: WhatsappMessageType;
            isActive?: boolean;
        },
    ): Promise<WhatsappAutomation> {
        return unwrapData(
            await apiClient.post(
                `/whatsapp-campaigns/community/${communityId}/automations`,
                data,
            ),
        );
    },

    async updateAutomation(
        communityId: string,
        automationId: string,
        data: Partial<{
            name: string;
            trigger: WhatsappAutomationTrigger;
            delayHours: number;
            body: string;
            messageType: WhatsappMessageType;
            isActive: boolean;
        }>,
    ): Promise<WhatsappAutomation> {
        return unwrapData(
            await apiClient.patch(
                `/whatsapp-campaigns/community/${communityId}/automations/${automationId}`,
                data,
            ),
        );
    },

    async deleteAutomation(
        communityId: string,
        automationId: string,
    ): Promise<{ deleted: true }> {
        return unwrapData(
            await apiClient.delete(
                `/whatsapp-campaigns/community/${communityId}/automations/${automationId}`,
            ),
        );
    },
};
