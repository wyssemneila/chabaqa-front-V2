import { Module } from '@nestjs/common';
import { FlouciPaymentService } from '@/shared/services/flouci-payment.service';

@Module({
  providers: [FlouciPaymentService],
  exports: [FlouciPaymentService],
})
export class FlouciModule {}


