import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeeService } from '@/shared/services/fee.service';
import { Subscription, SubscriptionSchema } from '@/infrastructure/database/schemas/commerce/subscription.schema';
import { Plan, PlanSchema } from '@/infrastructure/database/schemas/commerce/plan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Plan.name, schema: PlanSchema },
    ]),
  ],
  providers: [FeeService],
  exports: [FeeService],
})
export class FeeModule {}


