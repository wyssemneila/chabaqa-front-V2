import { Module } from '@nestjs/common';
import { KonnectPaymentService } from '@/shared/services/konnect-payment.service';

@Module({
  providers: [KonnectPaymentService],
  exports: [KonnectPaymentService],
})
export class KonnectModule {}
