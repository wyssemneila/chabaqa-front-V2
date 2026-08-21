import { apiClient } from './client'

export type IntegrationProvider = 'google_calendar'|'zapier'|'make'|'webhook'|'google_sheets'|'kit'|'brevo'|'zoom'|'discord'
export type ContactConsentOption = {
  communityId: string
  communityName: string
  communitySlug?: string
  provider: 'kit' | 'brevo'
  policyVersion: string
  granted: boolean
  consentedAt?: string
  revokedAt?: string
}
export const creatorIntegrationsApi = {
  list: () => apiClient.get<any[]>('/creator/integrations'),
  setup: (provider: IntegrationProvider) => apiClient.get<any>(`/creator/integrations/${provider}/setup`),
  connect: (provider: IntegrationProvider, config: Record<string, unknown> = {}, communityId?: string) => apiClient.post('/creator/integrations', { provider, config, communityId }),
  startOAuth: (provider: 'google_sheets'|'zoom'|'discord', config: Record<string, unknown> = {}, communityId?: string) => apiClient.post(`/creator/integrations/${provider}/oauth/start`, { config, communityId }),
  saveCredentials: (provider: 'kit'|'brevo', apiKey: string, config: Record<string, unknown> = {}, communityId?: string) => apiClient.post(`/creator/integrations/${provider}/credentials`, { apiKey, config, communityId }),
  updateConfiguration: (provider: 'google_sheets'|'kit'|'brevo'|'zoom'|'discord', config: Record<string, unknown> = {}, communityId?: string) => apiClient.patch(`/creator/integrations/${provider}/configuration`, { config, communityId }),
  testConnection: (provider: 'google_sheets'|'kit'|'brevo'|'zoom'|'discord') => apiClient.post(`/creator/integrations/${provider}/test`),
  contactConsentOptions: () => apiClient.get<ContactConsentOption[]>('/creator/integrations/contact-consents'),
  contactConsentOptionsForCommunity: (communityId: string) => apiClient.get<ContactConsentOption[]>(`/creator/integrations/contact-consents/${communityId}`),
  setContactConsent: (data: { provider: 'kit' | 'brevo'; communityId: string; policyVersion: string; granted: boolean }) => apiClient.post('/creator/integrations/contact-consent', data),
  disconnect: (id: string) => apiClient.delete(`/creator/integrations/${id}`),
  webhooks: () => apiClient.get<any[]>('/creator/integrations/webhooks'),
  createWebhook: (data: { name: string; url: string; events: string[]; communityId?: string }) => apiClient.post('/creator/integrations/webhooks', data),
  deleteWebhook: (id: string) => apiClient.delete(`/creator/integrations/webhooks/${id}`),
  testWebhook: (id: string) => apiClient.post(`/creator/integrations/webhooks/${id}/test`),
  deliveries: () => apiClient.get<any[]>('/creator/integrations/deliveries'),
  providerDeliveries: () => apiClient.get<any[]>('/creator/integrations/provider-deliveries'),
  replayDelivery: (id: string) => apiClient.post(`/creator/integrations/deliveries/${id}/replay`),
  apiKeys: () => apiClient.get<any[]>('/creator/integrations/api-keys'),
  createApiKey: (name: string, scopes = ['read']) => apiClient.post('/creator/integrations/api-keys', { name, scopes }),
  revokeApiKey: (id: string) => apiClient.delete(`/creator/integrations/api-keys/${id}`),
}
