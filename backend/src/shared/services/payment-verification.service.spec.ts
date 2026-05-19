import { PaymentVerificationService } from '@/shared/services/payment-verification.service';

describe('PaymentVerificationService', () => {
  const service = new PaymentVerificationService();

  it('normalizes a paid Stripe payload to the shared contract', () => {
    expect(
      service.fromPayload('stripe', {
        status: 'succeeded',
        orderId: 'order-1',
        targetId: 'community-1',
        contentType: 'community',
      }),
    ).toEqual(
      expect.objectContaining({
        success: true,
        status: 'paid',
        provider: 'stripe',
        orderId: 'order-1',
        targetId: 'community-1',
        targetType: 'community',
        fulfillmentStatus: 'completed',
      }),
    );
  });

  it('normalizes action-required session payments', () => {
    expect(
      service.fromPayload('konnect', {
        status: 'paid_action_required',
        orderId: 'order-2',
        action: 'choose_session_slot',
      }),
    ).toEqual(
      expect.objectContaining({
        success: true,
        status: 'requires_action',
        provider: 'konnect',
        fulfillmentStatus: 'requires_booking',
        actionRequired: 'choose_session_slot',
      }),
    );
  });

  it('normalizes pending and failed provider statuses', () => {
    expect(service.fromPayload('flouci', { status: 'PENDING' })).toEqual(
      expect.objectContaining({ success: false, status: 'pending', provider: 'flouci' }),
    );
    expect(service.fromPayload('manual', { status: 'rejected' })).toEqual(
      expect.objectContaining({ success: false, status: 'failed', provider: 'manual' }),
    );
  });
});
