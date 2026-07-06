import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionController } from '@/domains/commerce/subscription/subscription.controller';
import { Subscription, SubscriptionSchema } from '@/infrastructure/database/schemas/commerce/subscription.schema';
import { Plan, PlanSchema } from '@/infrastructure/database/schemas/commerce/plan.schema';
import { Order, OrderSchema } from '@/infrastructure/database/schemas/commerce/order.schema';
import { BillingInvoice, BillingInvoiceSchema } from '@/infrastructure/database/schemas/commerce/billing-invoice.schema';
import { UsageEvent, UsageEventSchema } from '@/infrastructure/database/schemas/commerce/usage-event.schema';
import { SubscriptionAddon, SubscriptionAddonSchema } from '@/infrastructure/database/schemas/commerce/subscription-addon.schema';
import {
  CommunityMemberSubscription,
  CommunityMemberSubscriptionSchema,
} from '@/infrastructure/database/schemas/commerce/community-member-subscription.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { Cours, CoursSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { CommunityStaff, CommunityStaffSchema } from '@/infrastructure/database/schemas/community/community-staff.schema';
import { StorageUsage, StorageUsageSchema } from '@/infrastructure/database/schemas/shared/storage-usage.schema';
import { EmailCampaign, EmailCampaignSchema } from '@/infrastructure/database/schemas/communication/email-campaign.schema';
import { WhatsappCampaign, WhatsappCampaignSchema } from '@/infrastructure/database/schemas/communication/whatsapp-campaign.schema';
import { SubscriptionService } from '@/domains/commerce/subscription/subscription.service';
import { SubscriptionScheduler } from '@/domains/commerce/subscription/subscription.scheduler';
import { AdminGuard } from '@/domains/auth/guards/admin.guard';
import { InternalServiceTokenGuard } from '@/shared/guards/internal-service-token.guard';
import { StripePaymentService } from '@/shared/services/stripe-payment.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Plan.name, schema: PlanSchema },
      { name: Order.name, schema: OrderSchema },
      { name: BillingInvoice.name, schema: BillingInvoiceSchema },
      { name: UsageEvent.name, schema: UsageEventSchema },
      { name: SubscriptionAddon.name, schema: SubscriptionAddonSchema },
      { name: CommunityMemberSubscription.name, schema: CommunityMemberSubscriptionSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: Cours.name, schema: CoursSchema },
      { name: CommunityStaff.name, schema: CommunityStaffSchema },
      { name: StorageUsage.name, schema: StorageUsageSchema },
      { name: EmailCampaign.name, schema: EmailCampaignSchema },
      { name: WhatsappCampaign.name, schema: WhatsappCampaignSchema },
    ]),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionScheduler, AdminGuard, InternalServiceTokenGuard, StripePaymentService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}

