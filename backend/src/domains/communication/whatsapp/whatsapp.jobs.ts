export const WHATSAPP_CAMPAIGN_MAX_RETRY_ATTEMPTS = 3;
export const WHATSAPP_CAMPAIGN_RETRY_BASE_DELAY_MS = 30_000;

export type WhatsappCampaignSendTrigger = 'manual' | 'scheduled' | 'automation' | 'retry';

export interface WhatsappCampaignSendJobPayload {
  campaignId: string;
  requestedBy: string;
  trigger: WhatsappCampaignSendTrigger;
  attempt?: number;
}
