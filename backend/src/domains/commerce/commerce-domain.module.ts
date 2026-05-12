import { Module } from '@nestjs/common';
import { PaymentModule } from '@/shared/modules/payment.module';
import { SubscriptionModule } from '@/domains/commerce/subscription/subscription.module';
import { WalletModule } from '@/domains/commerce/wallet/wallet.module';
import { PayoutModule } from '@/domains/commerce/payout/payout.module';
import { ProductModule } from '@/domains/commerce/product/product.module';
import { SessionModule } from '@/domains/commerce/session/session.module';
import { EventModule } from '@/domains/commerce/event/event.module';
import { FeeModule } from '@/shared/modules/fee.module';
import { PromoModule } from '@/shared/modules/promo.module';
import { FlouciModule } from '@/shared/modules/flouci.module';

@Module({
  imports: [PaymentModule, SubscriptionModule, WalletModule, PayoutModule, ProductModule, SessionModule, EventModule, FeeModule, PromoModule, FlouciModule],
  exports: [PaymentModule, SubscriptionModule, WalletModule, PayoutModule, ProductModule, SessionModule, EventModule, FeeModule, PromoModule, FlouciModule],
})
export class CommerceDomainModule {}
