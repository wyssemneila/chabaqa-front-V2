import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PolicyService } from '@/shared/services/policy.service';
import { Subscription, SubscriptionSchema } from '@/infrastructure/database/schemas/commerce/subscription.schema';
import { Plan, PlanSchema } from '@/infrastructure/database/schemas/commerce/plan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Plan.name, schema: PlanSchema },
    ]),
  ],
  providers: [PolicyService],
  exports: [PolicyService],
})
export class PolicyModule {}


