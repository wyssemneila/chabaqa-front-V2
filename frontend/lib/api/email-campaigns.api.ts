import { apiClient, PaginationParams } from './client';

// ============================================================================
// Type Definitions
// ============================================================================

export type EmailCampaignStatus =
    | 'draft'
    | 'scheduled'
    | 'sending'
    | 'sent'
    | 'failed'
    | 'cancelled';

export type EmailCampaignType =
    | 'announcement'
    | 'newsletter'
    | 'promotion'
    | 'event_reminder'
    | 'course_update'
    | 'inactive_user_reactivation'
    | 'course_progress_reminder'
    | 'welcome'
    | 'custom';

export type InactivityPeriod =
    | 'last_7_days'
    | 'last_15_days'
    | 'last_30_days'
    | 'last_60_days'
    | 'more_than_60_days';

export type ContentType =
    | 'event'
    | 'challenge'
    | 'cours'
    | 'product'
    | 'session'
    | 'all';

export interface EmailRecipient {
    userId: string;
    email: string;
    name: string;
    status: 'pending' | 'sent' | 'failed' | 'bounced';
    sentAt?: string;
    errorMessage?: string;
    opened: boolean;
    openedAt?: string;
    clickCount: number;
    clickedAt?: string[];
    personalizedContent?: string;
    personalizedSubject?: string;
}

export interface EmailCampaign {
    _id: string;
    title: string;
    subject: string;
    content: string;
    communityId: string;
    creatorId: {
        _id: string;
        name: string;
        email: string;
    };
    type: EmailCampaignType;
    status: EmailCampaignStatus;
    recipients: EmailRecipient[];
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    openCount: number;
    clickCount: number;
    isHtml: boolean;
    templateId?: string;
    templateData?: Record<string, any>;
    trackOpens: boolean;
    trackClicks: boolean;
    isInactiveUserCampaign?: boolean;
    targetInactivityPeriod?: InactivityPeriod;
    targetDaysThreshold?: number;
    targetAllInactive?: boolean;
    // Course progress fields
    isCourseProgressCampaign?: boolean;
    targetCourseId?: string;
    targetMaxProgressPct?: number;
    targetMinEnrolledDays?: number;
    // Automation template fields
    isAutomationTemplate?: boolean;
    eventTrigger?: string;
    automationActive?: boolean;
    scheduledAt?: string;
    sentAt?: string;
    createdAt: string;
    updatedAt?: string;
    metadata?: Record<string, any>;
}

export interface CampaignStats {
    totalCampaigns: number;
    totalEmailsSent: number;
    totalEmailsFailed: number;
    totalOpens: number;
    totalClicks: number;
    averageOpenRate: number;
    averageClickRate: number;
    reactivationCampaigns: number;
    reactivationSuccessRate: number;
}

export interface InactiveUserStats {
    totalMembers: number;
    activeUsers: number;
    inactive7d: number;
    inactive15d: number;
    inactive30d: number;
    inactive60dPlus: number;
    totalInactiveUsers: number;
    breakdown: any[];
}

export interface UserLoginActivity {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    communityId: string;
    lastLoginAt: string;
    daysSinceLastLogin: number;
    inactivityStatus: 'active' | 'inactive_7d' | 'inactive_15d' | 'inactive_30d' | 'inactive_60d_plus';
    isReactivationTarget: boolean;
    lastReactivationEmailSent?: string;
    reactivationEmailCount: number;
    joinedAt: string;
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// Request DTOs
// ============================================================================

export interface CreateEmailCampaignDto {
    title: string;
    subject: string;
    content: string;
    communityId: string;
    type?: EmailCampaignType;
    isHtml?: boolean;
    trackOpens?: boolean;
    trackClicks?: boolean;
    scheduledAt?: string;
    metadata?: Record<string, any>;
}

export interface CreateInactiveUserCampaignDto {
    title: string;
    subject: string;
    content: string;
    communityId: string;
    inactivityPeriod: InactivityPeriod;
    targetAllInactive?: boolean;
    maxRecipients?: number;
    isHtml?: boolean;
    trackOpens?: boolean;
    trackClicks?: boolean;
    scheduledAt?: string;
    metadata?: Record<string, any>;
}

export interface CreateContentReminderDto {
    title: string;
    subject: string;
    content: string;
    communityId: string;
    contentType: ContentType;
    contentId?: string;
    scheduledAt?: string;
    isHtml?: boolean;
    trackOpens?: boolean;
    trackClicks?: boolean;
    metadata?: Record<string, any>;
}

export interface CreateCourseProgressCampaignDto {
    title: string;
    subject: string;
    content: string;
    communityId: string;
    targetCourseId: string;
    targetMaxProgressPct: number;
    targetMinEnrolledDays: number;
    scheduledAt?: string;
    isHtml?: boolean;
    trackOpens?: boolean;
    trackClicks?: boolean;
    maxRecipients?: number;
}

export interface CreateWelcomeTemplateDto {
    subject: string;
    content: string;
    isHtml?: boolean;
    automationActive?: boolean;
}

export interface UpdateWelcomeTemplateDto {
    subject?: string;
    content?: string;
    isHtml?: boolean;
}

export interface CreateInactivityAutomationDto {
    title: string;
    subject: string;
    content: string;
    communityId: string;
    minInactiveDays: number;
    isHtml?: boolean;
}

export interface PreviewAudienceDto {
    communityId: string;
    filterType: 'inactivity' | 'course_progress';
    inactiveFilter?: { minInactiveDays: number };
    courseProgressFilter?: {
        courseId: string;
        maxProgressPct: number;
        minEnrolledDays: number;
    };
}

export interface PreviewAudienceResponse {
    total: number;
    sample: Array<{ userId: string; email: string; name: string }>;
    filterType: string;
}

export interface UpdateEmailCampaignDto {
    title?: string;
    subject?: string;
    content?: string;
    status?: EmailCampaignStatus;
    scheduledAt?: string;
    isHtml?: boolean;
    trackOpens?: boolean;
    trackClicks?: boolean;
    metadata?: Record<string, any>;
}

export interface EmailCampaignQueryParams extends PaginationParams {
    status?: EmailCampaignStatus;
    type?: EmailCampaignType;
    inactiveUserCampaigns?: boolean;
    search?: string;
}

export interface InactiveUserQueryParams {
    period?: InactivityPeriod;
    limit?: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface GetCampaignsResponse {
    campaigns: EmailCampaign[];
    total: number;
    page: number;
    limit: number;
}

export interface SendCampaignResponse {
    message: string;
    campaignId: string;
    queued?: boolean;
}

export interface CreateContentReminderResponse {
    campaignId: string;
    queued?: boolean;
}

export interface CancelCampaignResponse {
    message: string;
    campaignId: string;
}

export interface DuplicateCampaignResponse {
    title?: string;
}

export interface GetCampaignRecipientsResponse {
    recipients: EmailRecipient[];
    total: number;
    page: number;
    limit: number;
}

export interface SendTestEmailResponse {
    message: string;
    toEmail: string;
}

export interface InactivityPeriodInfo {
    value: string;
    label: string;
    days: number;
}

export interface GetInactivityPeriodsResponse {
    periods: InactivityPeriodInfo[];
}

// ============================================================================
// API Client Methods
// ============================================================================

export const emailCampaignsApi = {
    unwrapData<T>(response: any): T {
        if (response?.data?.data !== undefined) return response.data.data as T;
        if (response?.data !== undefined) return response.data as T;
        return response as T;
    },

    /**
     * Get all campaigns for a community with pagination and filters
     */
    async getCommunityCampaigns(
        communityId: string,
        params?: EmailCampaignQueryParams
    ): Promise<GetCampaignsResponse> {
        const response = await apiClient.get<any>(
            `/email-campaigns/community/${communityId}`,
            params
        );
        // Unwrap common shapes:
        // 1) { success, message, data: { campaigns, total, page, limit } }
        // 2) { campaigns, total, page, limit }
        // 3) direct campaigns payload (rare)
        if (response?.data?.campaigns) return response.data as GetCampaignsResponse;
        if (response?.data?.data?.campaigns) return response.data.data as GetCampaignsResponse;
        if (response?.campaigns) return response as GetCampaignsResponse;
        return response as GetCampaignsResponse;
    },

    /**
     * Get campaign statistics for a community
     */
    async getCampaignStats(communityId: string): Promise<CampaignStats> {
        const response = await apiClient.get<any>(
            `/email-campaigns/community/${communityId}/stats`
        );
        return this.unwrapData<CampaignStats>(response);
    },

    /**
     * Get inactive user statistics for a community
     */
    async getInactiveUserStats(communityId: string): Promise<InactiveUserStats> {
        const response = await apiClient.get<any>(
            `/email-campaigns/community/${communityId}/inactive-stats`
        );
        return this.unwrapData<InactiveUserStats>(response);
    },

    /**
     * Get inactive users for a community
     */
    async getInactiveUsers(
        communityId: string,
        params?: InactiveUserQueryParams
    ): Promise<UserLoginActivity[]> {
        const response = await apiClient.get<any>(
            `/email-campaigns/community/${communityId}/inactive-users`,
            params
        );
        return this.unwrapData<UserLoginActivity[]>(response);
    },

    /**
     * Get a specific campaign by ID
     */
    async getCampaign(campaignId: string): Promise<EmailCampaign> {
        const response = await apiClient.get<any>(`/email-campaigns/${campaignId}`);
        return this.unwrapData<EmailCampaign>(response);
    },

    /**
     * Create a regular email campaign
     */
    async createCampaign(data: CreateEmailCampaignDto): Promise<EmailCampaign> {
        const response = await apiClient.post<any>('/email-campaigns', data);
        return this.unwrapData<EmailCampaign>(response);
    },

    /**
     * Create an inactive user reactivation campaign
     */
    async createInactiveUserCampaign(
        data: CreateInactiveUserCampaignDto
    ): Promise<EmailCampaign> {
        const response = await apiClient.post<any>('/email-campaigns/inactive-users', data);
        return this.unwrapData<EmailCampaign>(response);
    },

    /**
     * Update a campaign (only works for draft campaigns)
     */
    async updateCampaign(
        campaignId: string,
        data: UpdateEmailCampaignDto
    ): Promise<EmailCampaign> {
        const response = await apiClient.put<any>(`/email-campaigns/${campaignId}`, data);
        return this.unwrapData<EmailCampaign>(response);
    },

    /**
     * Delete a campaign (only works for draft campaigns)
     */
    async deleteCampaign(campaignId: string): Promise<void> {
        await apiClient.delete<void>(`/email-campaigns/${campaignId}`);
    },

    /**
     * Send a campaign to all recipients
     */
    async sendCampaign(campaignId: string): Promise<SendCampaignResponse> {
        const response = await apiClient.post<any>(
            `/email-campaigns/${campaignId}/send`
        );
        return this.unwrapData<SendCampaignResponse>(response);
    },

    /**
     * Create and send a content reminder campaign
     */
    async createContentReminder(
        data: CreateContentReminderDto
    ): Promise<CreateContentReminderResponse> {
        const response = await apiClient.post<any>(
            '/email-campaigns/content-reminder',
            data
        );
        return this.unwrapData<CreateContentReminderResponse>(response);
    },

    /**
     * Cancel a scheduled campaign
     */
    async cancelCampaign(campaignId: string): Promise<CancelCampaignResponse> {
        const response = await apiClient.post<any>(
            `/email-campaigns/${campaignId}/cancel`
        );
        return this.unwrapData<CancelCampaignResponse>(response);
    },

    /**
     * Duplicate/copy a campaign
     */
    async duplicateCampaign(
        campaignId: string,
        newTitle?: string
    ): Promise<EmailCampaign> {
        const response = await apiClient.post<any>(
            `/email-campaigns/${campaignId}/duplicate`,
            { title: newTitle }
        );
        return this.unwrapData<EmailCampaign>(response);
    },

    /**
     * Get campaign recipients with pagination and filters
     */
    async getCampaignRecipients(
        campaignId: string,
        params?: {
            page?: number;
            limit?: number;
            status?: string;
            opened?: boolean;
        }
    ): Promise<GetCampaignRecipientsResponse> {
        const response = await apiClient.get<any>(
            `/email-campaigns/${campaignId}/recipients`,
            params
        );
        return this.unwrapData<GetCampaignRecipientsResponse>(response);
    },

    /**
     * Send a test email
     */
    async sendTestEmail(data: {
        toEmail: string;
        subject: string;
        content: string;
        communityId?: string;
        isHtml?: boolean;
    }): Promise<SendTestEmailResponse> {
        const response = await apiClient.post<any>(
            '/email-campaigns/test-email',
            data
        );
        return this.unwrapData<SendTestEmailResponse>(response);
    },

    /**
     * Get available inactivity periods
     */
    async getInactivityPeriods(): Promise<GetInactivityPeriodsResponse> {
        const response = await apiClient.get<any>(
            '/email-campaigns/inactivity-periods'
        );
        return this.unwrapData<GetInactivityPeriodsResponse>(response);
    },

    // ── Course Progress Campaigns ──────────────────────────────────────────────

    async createCourseProgressCampaign(data: CreateCourseProgressCampaignDto): Promise<EmailCampaign> {
        const response = await apiClient.post<any>('/email-campaigns/course-progress', data);
        return this.unwrapData<EmailCampaign>(response);
    },

    async previewAudience(data: PreviewAudienceDto): Promise<PreviewAudienceResponse> {
        const response = await apiClient.post<any>('/email-campaigns/preview-audience', data);
        return this.unwrapData<PreviewAudienceResponse>(response);
    },

    // ── Welcome Email Automation ───────────────────────────────────────────────

    async createWelcomeTemplate(communityId: string, data: CreateWelcomeTemplateDto): Promise<EmailCampaign> {
        const response = await apiClient.post<any>(`/email-campaigns/welcome-template/${communityId}`, data);
        return this.unwrapData<EmailCampaign>(response);
    },

    async getWelcomeTemplate(communityId: string): Promise<EmailCampaign | null> {
        try {
            const response = await apiClient.get<any>(`/email-campaigns/welcome-template/${communityId}`);
            return this.unwrapData<EmailCampaign | null>(response);
        } catch {
            return null;
        }
    },

    async updateWelcomeTemplate(communityId: string, data: UpdateWelcomeTemplateDto): Promise<EmailCampaign> {
        const response = await apiClient.put<any>(`/email-campaigns/welcome-template/${communityId}`, data);
        return this.unwrapData<EmailCampaign>(response);
    },

    async deleteWelcomeTemplate(communityId: string): Promise<void> {
        await apiClient.delete<void>(`/email-campaigns/welcome-template/${communityId}`);
    },

    async toggleWelcomeTemplate(communityId: string, active: boolean): Promise<EmailCampaign> {
        const response = await apiClient.patch<any>(`/email-campaigns/welcome-template/${communityId}/toggle`, { active });
        return this.unwrapData<EmailCampaign>(response);
    },

    // ── Inactivity Automations ─────────────────────────────────────────────────

    async createInactivityAutomation(data: CreateInactivityAutomationDto): Promise<EmailCampaign> {
        const response = await apiClient.post<any>('/email-campaigns/inactivity-automation', data);
        return this.unwrapData<EmailCampaign>(response);
    },

    async getInactivityAutomations(communityId: string): Promise<EmailCampaign[]> {
        const response = await apiClient.get<any>(`/email-campaigns/inactivity-automation/${communityId}`);
        const data = this.unwrapData<EmailCampaign[] | any>(response);
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        return [];
    },

    async toggleInactivityAutomation(automationId: string, active: boolean): Promise<EmailCampaign> {
        const response = await apiClient.patch<any>(`/email-campaigns/inactivity-automation/${automationId}/toggle`, { active });
        return this.unwrapData<EmailCampaign>(response);
    },
};
