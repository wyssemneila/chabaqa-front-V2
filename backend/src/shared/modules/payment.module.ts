import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripePaymentService } from '@/shared/services/stripe-payment.service';
import { FlouciPaymentService } from '@/shared/services/flouci-payment.service';
import { KonnectPaymentService } from '@/shared/services/konnect-payment.service';
import { PaymentController } from '@/shared/controllers/payment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { Order, OrderSchema } from '@/infrastructure/database/schemas/commerce/order.schema';
import { PromoCode, PromoCodeSchema } from '@/infrastructure/database/schemas/commerce/promo-code.schema';
import { Subscription, SubscriptionSchema } from '@/infrastructure/database/schemas/commerce/subscription.schema';
import { Plan, PlanSchema } from '@/infrastructure/database/schemas/commerce/plan.schema';
import { Cours, CoursSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { Challenge, ChallengeSchema } from '@/infrastructure/database/schemas/learning/challenge.schema';
import { Event, EventSchema } from '@/infrastructure/database/schemas/commerce/event.schema';
import { Product, ProductSchema } from '@/infrastructure/database/schemas/commerce/product.schema';
import { Session, SessionSchema } from '@/infrastructure/database/schemas/commerce/session.schema';
import {
  ProcessedWebhookEvent,
  ProcessedWebhookEventSchema,
} from '@/infrastructure/database/schemas/commerce/processed-webhook-event.schema';
import {
  PaymentAuditLog,
  PaymentAuditLogSchema,
} from '@/infrastructure/database/schemas/commerce/payment-audit-log.schema';
import { PromoService } from '@/shared/services/promo.service';
import { FeeService } from '@/shared/services/fee.service';
import { ManualPaymentService } from '@/shared/services/manual-payment.service';
import { PaymentFulfillmentService } from '@/shared/services/payment-fulfillment.service';
import { PaymentAuditService } from '@/shared/services/payment-audit.service';
import { PaymentVerificationService } from '@/shared/services/payment-verification.service';
import { UploadModule } from '@/domains/shared/upload/upload.module';
import { NotificationModule } from '@/domains/communication/notification/notification.module';
import { CoursModule } from '@/domains/learning/course/cours.module';
import { ChallengeModule } from '@/domains/learning/challenge/challenge.module';
import { EventModule } from '@/domains/commerce/event/event.module';
import { SubscriptionModule } from '@/domains/commerce/subscription/subscription.module';
import { SessionModule } from '@/domains/commerce/session/session.module';
import { ProductModule } from '@/domains/commerce/product/product.module';
import { AffiliateModule } from '@/domains/community/affiliate/affiliate.module';
import { EmailModule } from '@/domains/communication/email/email.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: Community.name, schema: CommunitySchema },
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
      { name: PromoCode.name, schema: PromoCodeSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Plan.name, schema: PlanSchema },
      { name: Cours.name, schema: CoursSchema },
      { name: Challenge.name, schema: ChallengeSchema },
      { name: Event.name, schema: EventSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Session.name, schema: SessionSchema },
      { name: ProcessedWebhookEvent.name, schema: ProcessedWebhookEventSchema },
      { name: PaymentAuditLog.name, schema: PaymentAuditLogSchema },
    ]),
    UploadModule,
    NotificationModule,
    CoursModule,
    ChallengeModule,
    EventModule,
    SubscriptionModule,
    SessionModule,
    ProductModule,
    AffiliateModule,
    EmailModule,
  ],
  controllers: [PaymentController],
  providers: [
    FlouciPaymentService,
    StripePaymentService,
    KonnectPaymentService,
    PromoService,
    FeeService,
    ManualPaymentService,
    PaymentFulfillmentService,
    PaymentAuditService,
    PaymentVerificationService,
  ],
  exports: [
    FlouciPaymentService,
    StripePaymentService,
    KonnectPaymentService,
    ManualPaymentService,
    PromoService,
    FeeService,
    PaymentFulfillmentService,
    PaymentAuditService,
    PaymentVerificationService,
  ],
})
export class PaymentModule { }
