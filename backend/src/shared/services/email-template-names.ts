export enum EmailTemplateName {
  OTP = 'otp',
  GENERIC = 'generic',
  EVENT_TICKET = 'event-ticket',
  SESSION = 'session',
  CAMPAIGN_SHELL = 'campaign-shell',
}

export type TemplateContext = Record<string, any>;

