import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { isStrictProductionRuntime } from '@/shared/utils/security-config.util';

export interface LinkCheckoutSession {
  success: boolean;
  sessionId?: string;
  url?: string;
  providerAmount?: number;
  providerCurrency?: string;
  providerExchangeRate?: number;
  error?: string;
}

export interface LinkPaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  bank_account?: {
    bank_name: string;
    last4: string;
  };
}

export interface StripeSubscriptionDetails {
  success: boolean;
  error?: string;
  subscriptionId?: string;
  customerId?: string;
  status?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  trialEndsAt?: Date;
  cancelAtPeriodEnd?: boolean;
  providerPriceId?: string;
  paymentMethod?: LinkPaymentMethod;
}

export type StripeSubscriptionCancelResult = StripeSubscriptionDetails;

export interface StripePriceDetails {
  success: boolean;
  priceId?: string;
  providerAmount?: number;
  providerCurrency?: string;
  providerExchangeRate?: number;
  error?: string;
}

type StripeClient = InstanceType<typeof Stripe>;
type StripeCheckoutSession = Awaited<ReturnType<StripeClient['checkout']['sessions']['retrieve']>>;
type StripePaymentIntent = Awaited<ReturnType<StripeClient['paymentIntents']['retrieve']>>;
type StripeCustomer = Awaited<ReturnType<StripeClient['customers']['retrieve']>>;
type StripeSubscription = Awaited<ReturnType<StripeClient['subscriptions']['retrieve']>>;
type StripeWebhookEvent = ReturnType<StripeClient['webhooks']['constructEvent']>;

@Injectable()
export class StripePaymentService {
  private readonly stripe: StripeClient;
  private readonly mockMode: boolean;
  private cachedTndToUsdRate: number = 0.32; // Fallback rate
  private rateLastFetched: number = 0;
  private readonly RATE_CACHE_DURATION_MS = 1200000;

  constructor(private configService: ConfigService) {
    const stripeKey = this.resolveStripeSecretKey();
    const hasUsableStripeKey = /^sk_(test|live)_/.test(stripeKey);
    this.mockMode = !isStrictProductionRuntime() && (this.isEnvFlagEnabled('STRIPE_MOCK_MODE') || !hasUsableStripeKey);

    if (!hasUsableStripeKey && !this.mockMode) {
      throw new Error('STRIPE_SECRET_KEY or STRIPE_API_KEY must be a valid Stripe secret key');
    }

    if (this.mockMode) {
      console.warn('[Stripe] Development mock mode enabled. Real Stripe API calls are skipped.');
    }
    this.stripe = this.mockMode ? (null as unknown as StripeClient) : new Stripe(stripeKey);
  }

  get isMockMode(): boolean {
    return this.mockMode;
  }

  private isEnvFlagEnabled(name: string): boolean {
    return ['1', 'true', 'yes', 'on'].includes(
      String(this.configService.get(name) || '').trim().toLowerCase(),
    );
  }

  private resolveStripeSecretKey(): string {
    return String(
      this.configService.get('STRIPE_SECRET_KEY') ||
      this.configService.get('STRIPE_API_KEY') ||
      '',
    ).trim();
  }

  private resolveStripeWebhookSecret(): string {
    return String(
      this.configService.get('STRIPE_WEBHOOK_SECRET') ||
      this.configService.get('STRIPE_LINK_WEBHOOK_SECRET') ||
      '',
    ).trim();
  }

  private createMockId(prefix: string): string {
    return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
  }

  private resolveMockCheckoutUrl(successUrl: string, sessionId: string): string {
    const resolved = successUrl.replace('{CHECKOUT_SESSION_ID}', sessionId);
    const separator = resolved.includes('?') ? '&' : '?';
    return `${resolved}${separator}mockProvider=stripe`;
  }

  /**
   * Get TND to USD conversion rate (uses live API with caching and fallback)
   */
  private async getTndToUsdRate(): Promise<number> {
    const now = Date.now();

    // Return cached rate if still valid
    if (this.rateLastFetched && (now - this.rateLastFetched) < this.RATE_CACHE_DURATION_MS) {
      return this.cachedTndToUsdRate;
    }

    try {
      // Using exchangerate-api.com free tier (no API key required for basic usage)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/TND', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        if (data?.rates?.USD) {
          this.cachedTndToUsdRate = data.rates.USD;
          this.rateLastFetched = now;
          console.log(`[Stripe] Updated TND->USD rate: ${this.cachedTndToUsdRate}`);
        }
      }
    } catch (error) {
      console.warn('[Stripe] Failed to fetch live exchange rate, using cached/fallback:', error);
    }

    return this.cachedTndToUsdRate;
  }

  /**
   * Create a Stripe Link checkout session for faster, more secure payments
   */
  async createLinkCheckoutSession(params: {
    amountDT: number;
    currency?: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, any>;
    customerEmail?: string;
    lineItems?: Array<{
      name: string;
      description?: string;
      amount: number;
      quantity?: number;
    }>;
  }): Promise<LinkCheckoutSession> {
    try {
      if (this.mockMode) {
        const sessionId = this.createMockId('cs_mock');
        return {
          success: true,
          sessionId,
          url: this.resolveMockCheckoutUrl(params.successUrl, sessionId),
          providerAmount: params.amountDT,
          providerCurrency: (params.currency || 'TND').toUpperCase(),
          providerExchangeRate: 1,
        };
      }

      const inputCurrency = (params.currency || 'tnd').toLowerCase();
      let stripeCurrency = inputCurrency;
      let amountInStripeCurrency = params.amountDT;
      let conversionRate = 1;

      if (inputCurrency === 'tnd') {
        const tndToUsdRate = await this.getTndToUsdRate();
        stripeCurrency = 'usd';
        conversionRate = tndToUsdRate;
        amountInStripeCurrency = params.amountDT * tndToUsdRate;
      }

      const amount = Math.round(amountInStripeCurrency * 100);
      const currency = stripeCurrency;

      // Create checkout session with Link enabled
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        currency,
        line_items: params.lineItems ? params.lineItems.map(item => ({
          price_data: {
            currency,
            product_data: {
              name: item.name,
              description: item.description,
            },
            unit_amount: Math.round((item.amount * conversionRate) * 100),
          },
          quantity: item.quantity || 1,
        })) : [{
          price_data: {
            currency,
            product_data: {
              name: 'Payment',
            },
            unit_amount: amount,
          },
          quantity: 1,
        }],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata || {},
        customer_email: params.customerEmail,
        // Enable automatic tax calculation if available
        automatic_tax: { enabled: false },
        // Enable customer creation for better Link experience
        customer_creation: 'always',
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url || undefined,
        providerAmount: amount / 100,
        providerCurrency: currency.toUpperCase(),
        providerExchangeRate: conversionRate,
      };
    } catch (e: any) {
      return {
        success: false,
        error: e?.message || 'Link checkout session creation failed',
      };
    }
  }

  /**
   * Create a subscription checkout session with Link support
   */
  async createLinkSubscriptionSession(params: {
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    metadata?: Record<string, any>;
    trialPeriodDays?: number;
    providerAmount?: number;
    providerCurrency?: string;
    providerExchangeRate?: number;
  }): Promise<LinkCheckoutSession> {
    try {
      if (this.mockMode) {
        const sessionId = this.createMockId('cs_mock_sub');
        return {
          success: true,
          sessionId,
          url: this.resolveMockCheckoutUrl(params.successUrl, sessionId),
          providerAmount: params.providerAmount,
          providerCurrency: params.providerCurrency,
          providerExchangeRate: params.providerExchangeRate,
        };
      }

      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{
          price: params.priceId,
          quantity: 1,
        }],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        customer_email: params.customerEmail,
        metadata: params.metadata || {},
        subscription_data: {
          trial_period_days: params.trialPeriodDays,
          metadata: params.metadata || {},
        },
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url || undefined,
        providerAmount: params.providerAmount,
        providerCurrency: params.providerCurrency,
        providerExchangeRate: params.providerExchangeRate,
      };
    } catch (e: any) {
      return {
        success: false,
        error: e?.message || 'Link subscription session creation failed',
      };
    }
  }

  /**
   * Retrieve checkout session details
   */
  async getCheckoutSession(sessionId: string): Promise<{
    success: boolean;
    session?: StripeCheckoutSession;
    error?: string;
  }> {
    try {
      if (this.mockMode) {
        return {
          success: false,
          error: 'Stripe mock mode does not support retrieving checkout sessions',
        };
      }

      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent', 'subscription'],
      });

      return {
        success: true,
        session,
      };
    } catch (e: any) {
      return {
        success: false,
        error: e?.message || 'Failed to retrieve checkout session',
      };
    }
  }

  /**
   * Verify payment status from checkout session
   */
  async verifyLinkPayment(sessionId: string): Promise<{
    success: boolean;
    status?: string;
    checkoutStatus?: string | null;
    paymentIntentStatus?: string;
    amountDT?: number;
    providerAmount?: number;
    providerCurrency?: string;
    providerExchangeRate?: number;
    paymentMethod?: LinkPaymentMethod;
    customerId?: string;
    subscriptionId?: string;
    subscriptionStatus?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    trialEndsAt?: Date;
    cancelAtPeriodEnd?: boolean;
    sessionMetadata?: Record<string, string>;
    error?: string;
  }> {
    try {
      if (this.mockMode || String(sessionId || '').startsWith('cs_mock')) {
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return {
          success: true,
          status: 'complete',
          checkoutStatus: 'complete',
          paymentIntentStatus: 'succeeded',
          paymentMethod: {
            id: this.createMockId('pm_mock'),
            type: 'stripe-link',
            card: {
              brand: 'visa',
              last4: '4242',
              exp_month: 12,
              exp_year: now.getFullYear() + 2,
            },
          },
          providerAmount: undefined,
          providerCurrency: undefined,
          providerExchangeRate: undefined,
          customerId: this.createMockId('cus_mock'),
          subscriptionId: String(sessionId || '').startsWith('cs_mock_sub')
            ? this.createMockId('sub_mock')
            : undefined,
          subscriptionStatus: String(sessionId || '').startsWith('cs_mock_sub') ? 'active' : undefined,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          sessionMetadata: {},
        };
      }

      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent', 'customer', 'subscription'],
      });

      const paymentIntent = session.payment_intent as StripePaymentIntent | null;
      const customer = session.customer as StripeCustomer | string | null;
      const subscription = session.subscription as StripeSubscription | string | null;
      const subscriptionObject = (typeof subscription === 'object' ? subscription : null) as any;

      let paymentMethod: LinkPaymentMethod | undefined;
      if (paymentIntent?.payment_method) {
        const pm = await this.stripe.paymentMethods.retrieve(
          paymentIntent.payment_method as string
        );
        paymentMethod = {
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
          } : undefined,
          bank_account: pm.us_bank_account ? {
            bank_name: pm.us_bank_account.bank_name || 'Unknown',
            last4: pm.us_bank_account.last4 || '',
          } : undefined,
        };
      }

      const checkoutComplete = session.status === 'complete';
      const subscriptionStatus = subscriptionObject?.status;
      const status = session.payment_status === 'paid'
        ? 'paid'
        : (checkoutComplete && session.mode === 'subscription' ? 'complete' : (session.status || paymentIntent?.status));

      return {
        success: true,
        status,
        checkoutStatus: session.status,
        paymentIntentStatus: paymentIntent?.status,
        amountDT: typeof session.amount_total === 'number' ? session.amount_total / 100 : paymentIntent ? paymentIntent.amount / 100 : undefined,
        providerAmount: typeof session.amount_total === 'number' ? session.amount_total / 100 : paymentIntent ? paymentIntent.amount / 100 : undefined,
        providerCurrency: (session.currency || paymentIntent?.currency || '').toUpperCase() || undefined,
        providerExchangeRate: session.metadata?.providerExchangeRate ? Number(session.metadata.providerExchangeRate) : undefined,
        paymentMethod,
        customerId: typeof customer === 'string' ? customer : customer?.id,
        subscriptionId: typeof subscription === 'string' ? subscription : subscription?.id,
        subscriptionStatus,
        currentPeriodStart: subscriptionObject?.current_period_start ? new Date(subscriptionObject.current_period_start * 1000) : undefined,
        currentPeriodEnd: subscriptionObject?.current_period_end ? new Date(subscriptionObject.current_period_end * 1000) : undefined,
        trialEndsAt: subscriptionObject?.trial_end ? new Date(subscriptionObject.trial_end * 1000) : undefined,
        cancelAtPeriodEnd: subscriptionObject?.cancel_at_period_end,
        sessionMetadata: (session.metadata || subscriptionObject?.metadata || {}) as Record<string, string>,
      };
    } catch (e: any) {
      return {
        success: false,
        error: e?.message || 'Payment verification failed',
      };
    }
  }

  async getSubscriptionDetails(subscriptionId: string): Promise<StripeSubscriptionDetails> {
    try {
      if (this.mockMode || String(subscriptionId || '').startsWith('sub_mock')) {
        const now = new Date();
        return {
          success: true,
          subscriptionId,
          customerId: this.createMockId('cus_mock'),
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
          paymentMethod: {
            id: this.createMockId('pm_mock'),
            type: 'card',
            card: {
              brand: 'visa',
              last4: '4242',
              exp_month: 12,
              exp_year: now.getFullYear() + 2,
            },
          },
        };
      }

      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['default_payment_method', 'items.data.price'],
      });
      const subscriptionObject = subscription as any;
      const defaultPaymentMethod = subscriptionObject.default_payment_method;
      const paymentMethodObject =
        defaultPaymentMethod && typeof defaultPaymentMethod === 'object'
          ? defaultPaymentMethod
          : null;

      return {
        success: true,
        subscriptionId: subscription.id,
        customerId: typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id,
        status: subscriptionObject.status,
        currentPeriodStart: subscriptionObject.current_period_start
          ? new Date(subscriptionObject.current_period_start * 1000)
          : undefined,
        currentPeriodEnd: subscriptionObject.current_period_end
          ? new Date(subscriptionObject.current_period_end * 1000)
          : undefined,
        trialEndsAt: subscriptionObject.trial_end
          ? new Date(subscriptionObject.trial_end * 1000)
          : undefined,
        cancelAtPeriodEnd: subscriptionObject.cancel_at_period_end,
        providerPriceId: subscriptionObject.items?.data?.[0]?.price?.id,
        paymentMethod: paymentMethodObject
          ? {
              id: paymentMethodObject.id,
              type: paymentMethodObject.type,
              card: paymentMethodObject.card
                ? {
                    brand: paymentMethodObject.card.brand,
                    last4: paymentMethodObject.card.last4,
                    exp_month: paymentMethodObject.card.exp_month,
                    exp_year: paymentMethodObject.card.exp_year,
                  }
                : undefined,
            }
          : undefined,
      };
    } catch (e: any) {
      return {
        success: false,
        error: e?.message || 'Failed to retrieve Stripe subscription',
      };
    }
  }

  async getPriceDetails(priceId: string, businessAmount?: number): Promise<StripePriceDetails> {
    try {
      if (this.mockMode || String(priceId || '').startsWith('price_mock')) {
        return {
          success: true,
          priceId,
        };
      }

      const price = await this.stripe.prices.retrieve(priceId);
      const providerAmount = typeof price.unit_amount === 'number'
        ? price.unit_amount / 100
        : undefined;
      const providerCurrency = price.currency?.toUpperCase();
      const providerExchangeRate =
        providerAmount !== undefined && businessAmount && businessAmount > 0
          ? providerAmount / businessAmount
          : undefined;

      return {
        success: true,
        priceId: price.id,
        providerAmount,
        providerCurrency,
        providerExchangeRate,
      };
    } catch (e: any) {
      return {
        success: false,
        error: e?.message || 'Failed to retrieve Stripe price',
      };
    }
  }

  async cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<StripeSubscriptionCancelResult> {
    try {
      if (this.mockMode || String(subscriptionId || '').startsWith('sub_mock')) {
        const now = new Date();
        const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return {
          success: true,
          subscriptionId,
          customerId: this.createMockId('cus_mock'),
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd,
          cancelAtPeriodEnd: true,
        };
      }

      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
        expand: ['default_payment_method', 'items.data.price'],
      } as any);
      const subscriptionObject = subscription as any;

      return {
        success: true,
        subscriptionId: subscription.id,
        customerId: typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id,
        status: subscriptionObject.status,
        currentPeriodStart: subscriptionObject.current_period_start
          ? new Date(subscriptionObject.current_period_start * 1000)
          : undefined,
        currentPeriodEnd: subscriptionObject.current_period_end
          ? new Date(subscriptionObject.current_period_end * 1000)
          : undefined,
        trialEndsAt: subscriptionObject.trial_end
          ? new Date(subscriptionObject.trial_end * 1000)
          : undefined,
        cancelAtPeriodEnd: subscriptionObject.cancel_at_period_end,
        providerPriceId: subscriptionObject.items?.data?.[0]?.price?.id,
      };
    } catch (e: any) {
      return {
        success: false,
        error: e?.message || 'Failed to cancel Stripe subscription',
      };
    }
  }

  /**
   * Create webhook event for Link-specific events
   */
  async createWebhookEvent(
    body: Buffer,
    signature: string,
  ): Promise<{ success: boolean; event?: StripeWebhookEvent; error?: string }> {
    try {
      if (this.mockMode) {
        return {
          success: false,
          error: 'Stripe mock mode does not process signed webhooks',
        };
      }

      const webhookSecret = this.resolveStripeWebhookSecret();
      if (!webhookSecret) {
        return {
          success: false,
          error: 'Stripe webhook secret is not configured',
        };
      }
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret,
      );

      return {
        success: true,
        event,
      };
    } catch (e: any) {
      return {
        success: false,
        error: e?.message || 'Invalid webhook payload',
      };
    }
  }

  /**
   * Create a customer portal session for subscription management
   */
  async createCustomerPortalSession(customerId: string, returnUrl: string): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }> {
    try {
      if (this.mockMode) {
        const separator = returnUrl.includes('?') ? '&' : '?';
        return {
          success: true,
          url: `${returnUrl}${separator}billingPortal=mock`,
        };
      }

      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return {
        success: true,
        url: session.url,
      };
    } catch (e: any) {
      return {
        success: false,
        error: e?.message || 'Failed to create customer portal session',
      };
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(
    paymentIntentId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.mockMode) {
        return { success: true };
      }

      await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
      });

      return { success: true };
    } catch (e: any) {
      return {
        success: false,
        error: e?.message || 'Refund failed',
      };
    }
  }

  /**
   * Create a price for subscription plans
   */
  async createPrice(params: {
    amountDT: number;
    currency?: string;
    interval: 'month' | 'year';
    productName: string;
    productDescription?: string;
  }): Promise<{
    success: boolean;
    priceId?: string;
    providerAmount?: number;
    providerCurrency?: string;
    providerExchangeRate?: number;
    error?: string;
  }> {
    try {
      if (this.mockMode) {
        return {
          success: true,
          priceId: this.createMockId('price_mock'),
          providerAmount: params.amountDT,
          providerCurrency: (params.currency || 'TND').toUpperCase(),
          providerExchangeRate: 1,
        };
      }

      const inputCurrency = (params.currency || 'tnd').toLowerCase();
      let stripeCurrency = inputCurrency;
      let amountInStripeCurrency = params.amountDT;
      let conversionRate = 1;

      if (inputCurrency === 'tnd') {
        const tndToUsdRate = await this.getTndToUsdRate();
        stripeCurrency = 'usd';
        conversionRate = tndToUsdRate;
        amountInStripeCurrency = params.amountDT * tndToUsdRate;
      }

      // First create a product
      const product = await this.stripe.products.create({
        name: params.productName,
        description: params.productDescription,
      });

      // Then create a price
      const price = await this.stripe.prices.create({
        unit_amount: Math.round(amountInStripeCurrency * 100),
        currency: stripeCurrency,
        recurring: {
          interval: params.interval,
        },
        product: product.id,
      });

      return {
        success: true,
        priceId: price.id,
        providerAmount: Math.round(amountInStripeCurrency * 100) / 100,
        providerCurrency: stripeCurrency.toUpperCase(),
        providerExchangeRate: conversionRate,
      };
    } catch (e: any) {
      return {
        success: false,
        error: e?.message || 'Price creation failed',
      };
    }
  }
}
