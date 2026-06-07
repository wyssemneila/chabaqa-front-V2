import { Injectable } from '@nestjs/common';

export type PaymentVerificationStatus =
  | 'paid'
  | 'pending'
  | 'failed'
  | 'cancelled'
  | 'requires_action';

export type PaymentVerificationProvider = 'stripe' | 'flouci' | 'konnect' | 'manual';

export type PaymentVerificationTargetType =
  | 'community'
  | 'course'
  | 'chapter'
  | 'challenge'
  | 'event'
  | 'product'
  | 'session'
  | 'subscription';

export type PaymentFulfillmentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'requires_booking'
  | 'failed';

export interface PaymentVerificationResult {
  success: boolean;
  status: PaymentVerificationStatus;
  provider: PaymentVerificationProvider;
  orderId?: string;
  targetId?: string;
  targetType?: PaymentVerificationTargetType;
  fulfillmentStatus?: PaymentFulfillmentStatus;
  redirectUrl?: string;
  actionRequired?: 'choose_session_slot' | 'retry_payment' | 'contact_support';
  message?: string;
  [key: string]: any;
}

@Injectable()
export class PaymentVerificationService {
  normalizeProvider(raw?: string): PaymentVerificationProvider {
    const value = String(raw || '').toLowerCase();
    if (value.includes('stripe')) return 'stripe';
    if (value.includes('konnect')) return 'konnect';
    if (value.includes('manual')) return 'manual';
    return 'flouci';
  }

  normalizeStatus(raw?: string): PaymentVerificationStatus {
    const value = String(raw || '').toLowerCase();
    if (['paid', 'success', 'succeeded', 'complete', 'completed', 'active', 'trialing'].includes(value)) return 'paid';
    if (['paid_action_required', 'requires_action', 'requires_booking'].includes(value)) return 'requires_action';
    if (['failed', 'failure', 'error', 'rejected', 'unpaid', 'past_due', 'incomplete_expired'].includes(value)) return 'failed';
    if (['cancelled', 'canceled', 'expired'].includes(value)) return 'cancelled';
    return 'pending';
  }

  normalizeFulfillment(raw?: string, status?: PaymentVerificationStatus): PaymentFulfillmentStatus {
    const value = String(raw || '').toLowerCase();
    if (value === 'completed') return 'completed';
    if (value === 'processing') return 'processing';
    if (value === 'requires_booking') return 'requires_booking';
    if (value === 'failed') return 'failed';
    if (status === 'paid') return 'completed';
    if (status === 'requires_action') return 'requires_booking';
    if (status === 'failed') return 'failed';
    return 'pending';
  }

  fromPayload(provider: PaymentVerificationProvider, payload: Record<string, any>): PaymentVerificationResult {
    const status = this.normalizeStatus(payload.status);
    const requestedAction = payload.actionRequired || payload.action;
    const actionRequired =
      requestedAction === 'choose_session_slot' || payload.fulfillmentStatus === 'requires_booking'
        ? 'choose_session_slot'
        : requestedAction === 'retry_payment' || status === 'failed'
          ? 'retry_payment'
          : requestedAction === 'contact_support'
            ? 'contact_support'
            : undefined;
    const fulfillmentStatus = this.normalizeFulfillment(
      payload.fulfillmentStatus || payload.metadata?.fulfillmentStatus,
      status,
    );

    return {
      ...payload,
      success: status === 'paid' || status === 'requires_action',
      status,
      provider,
      orderId: payload.orderId?.toString?.() || payload.orderId,
      targetId: payload.targetId?.toString?.() || payload.targetId,
      targetType: payload.targetType || payload.contentType,
      fulfillmentStatus,
      actionRequired,
      action: actionRequired === 'choose_session_slot' ? 'choose_session_slot' : payload.action,
    };
  }
}
