import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { randomUUID } from 'crypto';

export interface OpenWaSessionResponse {
  id: string;
  name: string;
  status?: string;
  phone?: string;
  pushName?: string;
  lastError?: string | null;
}

export interface OpenWaQrResponse {
  qr?: string;
  qrCode?: string;
  dataUrl?: string;
  status?: string;
}

export interface OpenWaMessageResponse {
  id?: string;
  messageId?: string;
  status?: string;
  raw?: any;
}

export interface OpenWaHealthResponse {
  enabled: boolean;
  reachable: boolean;
  authenticated: boolean;
  status?: number;
  message?: string;
}

export interface OpenWaWebhookPayload {
  url: string;
  secret?: string;
  events?: string[];
}

export interface OpenWaMediaPayload {
  chatId: string;
  mediaUrl: string;
  caption?: string;
  filename?: string;
}

@Injectable()
export class OpenWaClientService {
  private readonly logger = new Logger(OpenWaClientService.name);
  private readonly client: AxiosInstance;

  constructor() {
    const baseURL = (
      process.env.OPENWA_BASE_URL || 'http://localhost:2785/api'
    ).replace(/\/+$/, '');
    const timeout = Number(process.env.OPENWA_REQUEST_TIMEOUT_MS || 15_000);
    this.client = axios.create({ baseURL, timeout });
  }

  isEnabled(): boolean {
    return (
      String(process.env.WHATSAPP_ENABLED || 'false').toLowerCase() === 'true'
    );
  }

  normalizePhoneToChatId(phoneE164: string): string {
    const digits = String(phoneE164 || '').replace(/\D/g, '');
    if (!digits) {
      throw new BadGatewayException('Invalid WhatsApp phone number');
    }
    return `${digits}@c.us`;
  }

  async createSession(name: string): Promise<OpenWaSessionResponse> {
    return this.request<OpenWaSessionResponse>({
      method: 'POST',
      url: '/sessions',
      data: { name },
    });
  }

  async startSession(sessionId: string): Promise<OpenWaSessionResponse> {
    try {
      return await this.request<OpenWaSessionResponse>({
        method: 'POST',
        url: `/sessions/${encodeURIComponent(sessionId)}/start`,
        timeout: Number(process.env.OPENWA_SESSION_START_TIMEOUT_MS || 120_000),
      });
    } catch (error: any) {
      const message = String(error?.message || '').toLowerCase();
      if (message.includes('session is already started')) {
        return this.getSession(sessionId);
      }
      throw error;
    }
  }

  async stopSession(sessionId: string): Promise<OpenWaSessionResponse> {
    return this.request<OpenWaSessionResponse>({
      method: 'POST',
      url: `/sessions/${encodeURIComponent(sessionId)}/stop`,
    });
  }

  async getSession(sessionId: string): Promise<OpenWaSessionResponse> {
    return this.request<OpenWaSessionResponse>({
      method: 'GET',
      url: `/sessions/${encodeURIComponent(sessionId)}`,
    });
  }

  async getQr(sessionId: string): Promise<OpenWaQrResponse> {
    return this.request<OpenWaQrResponse>({
      method: 'GET',
      url: `/sessions/${encodeURIComponent(sessionId)}/qr`,
    });
  }

  async requestPairingCode(
    sessionId: string,
    phoneNumber: string,
  ): Promise<{ pairingCode?: string; code?: string }> {
    return this.request<{ pairingCode?: string; code?: string }>({
      method: 'POST',
      url: `/sessions/${encodeURIComponent(sessionId)}/pairing-code`,
      data: { phoneNumber },
    });
  }

  async sendText(
    sessionId: string,
    chatId: string,
    text: string,
  ): Promise<OpenWaMessageResponse> {
    const response = await this.request<any>({
      method: 'POST',
      url: `/sessions/${encodeURIComponent(sessionId)}/messages/send-text`,
      data: { chatId, text },
    });
    return this.normalizeMessageResponse(response);
  }

  async sendMedia(
    sessionId: string,
    type: 'image' | 'video' | 'document',
    payload: OpenWaMediaPayload,
  ): Promise<OpenWaMessageResponse> {
    const response = await this.request<any>({
      method: 'POST',
      url: `/sessions/${encodeURIComponent(sessionId)}/messages/send-${type}`,
      data: payload,
    });
    return this.normalizeMessageResponse(response);
  }

  async createWebhook(
    sessionId: string,
    webhook: OpenWaWebhookPayload,
  ): Promise<any> {
    const secret = String(webhook.secret || '').trim() || undefined;
    // OpenWA strips custom headers matching x-openwa-* / content-type, and
    // signs with X-OpenWA-Signature when `secret` is set. We also send a
    // non-reserved shared-secret header so Chabaqa can verify without raw body.
    return this.request<any>({
      method: 'POST',
      url: `/sessions/${encodeURIComponent(sessionId)}/webhooks`,
      data: {
        url: webhook.url,
        secret,
        headers: secret ? { 'X-Webhook-Secret': secret } : undefined,
        events: webhook.events || [
          'message.received',
          'message.sent',
          'message.ack',
          'message.failed',
          'session.status',
          'session.authenticated',
          'session.disconnected',
        ],
      },
    });
  }

  async health(): Promise<OpenWaHealthResponse> {
    if (!this.isEnabled()) {
      return {
        enabled: false,
        reachable: false,
        authenticated: false,
        message: 'WhatsApp integration is disabled',
      };
    }
    const apiKey = String(process.env.OPENWA_API_KEY || '').trim();
    if (!apiKey) {
      return {
        enabled: true,
        reachable: false,
        authenticated: false,
        message: 'OpenWA API key is not configured',
      };
    }
    try {
      await this.request<any>({ method: 'GET', url: '/sessions' });
      return { enabled: true, reachable: true, authenticated: true };
    } catch (error: any) {
      const message = String(error?.message || 'OpenWA health check failed');
      return {
        enabled: true,
        reachable:
          !message.toLowerCase().includes('network') &&
          !message.toLowerCase().includes('econnrefused'),
        authenticated:
          !message.toLowerCase().includes('401') &&
          !message.toLowerCase().includes('403'),
        message,
      };
    }
  }

  private normalizeMessageResponse(response: any): OpenWaMessageResponse {
    return {
      id: response?.id || response?.messageId,
      messageId: response?.messageId || response?.id,
      status: response?.status,
      raw: response,
    };
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException('WhatsApp integration is disabled');
    }

    const apiKey = String(process.env.OPENWA_API_KEY || '').trim();
    if (!apiKey) {
      throw new ServiceUnavailableException('OpenWA API key is not configured');
    }

    try {
      const response = await this.client.request<T>({
        ...config,
        headers: {
          ...(config.headers || {}),
          'X-API-Key': apiKey,
          'X-Request-ID': randomUUID(),
        },
      });
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      const message = this.extractErrorMessage(error);
      this.logger.warn(
        `OpenWA ${config.method || 'GET'} ${config.url} failed (${status || 'no-status'}): ${message}`,
      );
      throw new BadGatewayException(`OpenWA request failed: ${message}`);
    }
  }

  private extractErrorMessage(error: any): string {
    const data = error?.response?.data;
    const message = data?.message || data?.error || error?.message;
    if (Array.isArray(message)) {
      return message.join('; ');
    }
    if (message && typeof message === 'object') {
      return JSON.stringify(message);
    }
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    if (data && typeof data === 'object') {
      return JSON.stringify(data);
    }
    return 'OpenWA request failed';
  }
}
