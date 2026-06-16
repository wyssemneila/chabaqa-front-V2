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
    const baseURL = (process.env.OPENWA_BASE_URL || 'http://localhost:2785/api').replace(/\/+$/, '');
    const timeout = Number(process.env.OPENWA_REQUEST_TIMEOUT_MS || 15_000);
    this.client = axios.create({ baseURL, timeout });
  }

  isEnabled(): boolean {
    return String(process.env.WHATSAPP_ENABLED || 'false').toLowerCase() === 'true';
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
    return this.request<OpenWaSessionResponse>({
      method: 'POST',
      url: `/sessions/${encodeURIComponent(sessionId)}/start`,
      timeout: Number(process.env.OPENWA_SESSION_START_TIMEOUT_MS || 120_000),
    });
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

  async requestPairingCode(sessionId: string, phoneNumber: string): Promise<{ pairingCode?: string; code?: string }> {
    return this.request<{ pairingCode?: string; code?: string }>({
      method: 'POST',
      url: `/sessions/${encodeURIComponent(sessionId)}/pairing-code`,
      data: { phoneNumber },
    });
  }

  async sendText(sessionId: string, chatId: string, text: string): Promise<OpenWaMessageResponse> {
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

  async createWebhook(sessionId: string, url: string, secret: string): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: `/sessions/${encodeURIComponent(sessionId)}/webhooks`,
      data: { url, secret },
    });
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
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'OpenWA request failed';
      this.logger.warn(`OpenWA ${config.method || 'GET'} ${config.url} failed (${status || 'no-status'}): ${message}`);
      throw new BadGatewayException(`OpenWA request failed: ${message}`);
    }
  }
}
