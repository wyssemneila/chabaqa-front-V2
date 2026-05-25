import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { isStrictProductionRuntime } from '@/shared/utils/security-config.util';

const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on']);
const PLACEHOLDER_VALUES = new Set(['your-flouci-token', 'your-flouci-secret']);

function getConfiguredEnv(name: string): string {
  const value = String(process.env[name] || '').trim();
  if (!value || PLACEHOLDER_VALUES.has(value.toLowerCase())) {
    return '';
  }
  return value;
}

function isFlouciExplicitlyEnabled(): boolean {
  return ['FLOUCI_ENABLED', 'PAYMENTS_FLOUCI_ENABLED'].some((name) =>
    ENABLED_VALUES.has(String(process.env[name] || '').trim().toLowerCase()),
  );
}

@Injectable()
export class FlouciPaymentService {
  private readonly http: AxiosInstance;
  private readonly baseUrl: string;
  private readonly appToken: string;
  private readonly appSecret: string;
  private readonly developerTrackingId?: string;
  private readonly enabled: boolean;

  constructor() {
    this.baseUrl = process.env.FLOUCI_BASE_URL || 'https://developers.flouci.com/api/';
    this.appToken = getConfiguredEnv('FLOUCI_APP_TOKEN');
    this.appSecret = getConfiguredEnv('FLOUCI_APP_SECRET');
    this.developerTrackingId = process.env.FLOUCI_DEVELOPER_TRACKING_ID;
    this.enabled = Boolean(this.appToken && this.appSecret);

    if (isStrictProductionRuntime() && isFlouciExplicitlyEnabled() && !this.enabled) {
      throw new Error('[Flouci] Missing FLOUCI_APP_TOKEN or FLOUCI_APP_SECRET in production');
    }
    this.http = axios.create({ baseURL: this.baseUrl, timeout: 15000 });
  }

  async initPayment(params: {
    amountTND: number;
    successUrl: string;
    failUrl: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; paymentId?: string; link?: string; qrCode?: string; error?: string }>
  {
    if (!this.enabled) {
      return { success: false, error: 'Flouci payments are not configured' };
    }

    try {
      const payload = {
        app_token: this.appToken,
        app_secret: this.appSecret,
        amount: Math.round(params.amountTND * 1000),
        accept_card: true,
        session_timeout_secs: 1800,
        success_link: params.successUrl,
        fail_link: params.failUrl,
        developer_tracking_id: this.developerTrackingId,
        payment_metadata: params.metadata || {},
      };

      const res = await this.http.post('payments/init', payload, {
        headers: {
          'Content-Type': 'application/json',
          'apppublic': this.appToken,
          'appsecret': this.appSecret,
        },
      });

      return {
        success: true,
        paymentId: res.data?.result?.payment_id,
        link: res.data?.result?.link,
        qrCode: res.data?.result?.qr_code_png,
      };
    } catch (e: any) {
      const msg = e?.response?.data?.result?.message || e?.message || 'Payment init failed';
      return { success: false, error: msg };
    }
  }

  async verifyPayment(paymentId: string): Promise<{ success: boolean; status?: string; amountTND?: number; paymentMethod?: string; transactionDate?: string; error?: string }>
  {
    if (!this.enabled) {
      return { success: false, error: 'Flouci payments are not configured' };
    }

    try {
      const payload = {
        app_token: this.appToken,
        app_secret: this.appSecret,
        payment_id: paymentId,
      };
      const res = await this.http.post('payments/verify', payload, {
        headers: {
          'Content-Type': 'application/json',
          'apppublic': this.appToken,
          'appsecret': this.appSecret,
        },
      });

      const r = res.data?.result || {};
      return {
        success: true,
        status: r.status,
        amountTND: typeof r.amount === 'number' ? r.amount / 1000 : undefined,
        paymentMethod: r.payment_method,
        transactionDate: r.transaction_date,
      };
    } catch (e: any) {
      return { success: false, error: 'Payment verification failed' };
    }
  }
}


