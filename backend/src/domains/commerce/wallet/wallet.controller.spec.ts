import { GoneException, ServiceUnavailableException } from '@nestjs/common';
import { WalletController } from '@/domains/commerce/wallet/wallet.controller';

describe('WalletController payment hardening', () => {
  const controller = new WalletController({} as any, {} as any);
  const original = process.env.PAYMENTS_ENABLE_WALLET_FALLBACK;

  afterEach(() => {
    if (original === undefined) delete process.env.PAYMENTS_ENABLE_WALLET_FALLBACK;
    else process.env.PAYMENTS_ENABLE_WALLET_FALLBACK = original;
  });

  it('returns gone when wallet fallback is disabled by default', async () => {
    delete process.env.PAYMENTS_ENABLE_WALLET_FALLBACK;
    await expect(controller.purchaseWithWallet(
      { user: { _id: 'user' } }, 'course', 'course', 1, 'creator',
    )).rejects.toBeInstanceOf(GoneException);
  });

  it('fails closed instead of trusting client price and creator when enabled', async () => {
    process.env.PAYMENTS_ENABLE_WALLET_FALLBACK = 'true';
    await expect(controller.purchaseWithWallet(
      { user: { _id: 'user' } }, 'course', 'course', 0.01, 'attacker',
    )).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
