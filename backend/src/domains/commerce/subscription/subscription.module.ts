import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionController } from '@/domains/commerce/subscription/subscription.controller';
import { Subscription, SubscriptionSchema } from '@/infrastructure/database/schemas/commerce/subscription.schema';
import { Plan, PlanSchema } from '@/infrastructure/database/schemas/commerce/plan.schema';
import { SubscriptionService } from '@/domains/commerce/subscription/subscription.service';
import { SubscriptionScheduler } from '@/domains/commerce/subscription/subscription.scheduler';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Plan.name, schema: PlanSchema },
    ]),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionScheduler],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}


