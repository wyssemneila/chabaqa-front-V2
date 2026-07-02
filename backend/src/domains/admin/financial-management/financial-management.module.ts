import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FinancialManagementController } from '@/domains/admin/financial-management/financial-management.controller';
import { FinancialManagementService } from '@/domains/admin/financial-management/financial-management.service';

// Import schemas
import { Subscription, SubscriptionSchema } from '@/infrastructure/database/schemas/commerce/subscription.schema';
import { WalletTransaction, WalletTransactionSchema } from '@/infrastructure/database/schemas/commerce/wallet-transaction.schema';
import { Payout, PayoutSchema } from '@/infrastructure/database/schemas/commerce/payout.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { Plan, PlanSchema } from '@/infrastructure/database/schemas/commerce/plan.schema';
import { Order, OrderSchema } from '@/infrastructure/database/schemas/commerce/order.schema';
import { PaymentAuditLog, PaymentAuditLogSchema } from '@/infrastructure/database/schemas/commerce/payment-audit-log.schema';
import { SubscriptionModule } from '@/domains/commerce/subscription/subscription.module';
import { PaymentAuditService } from '@/shared/services/payment-audit.service';

// Import admin common services
import { AuditLogService } from '@/domains/admin/common/services/audit-log.service';
import { AdminAuthGuard } from '@/domains/admin/common/guards/admin-auth.guard';
import { AdminRolesGuard } from '@/domains/admin/common/guards/admin-roles.guard';

@Module({
  imports: [
    SubscriptionModule,
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      { name: Payout.name, schema: PayoutSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: User.name, schema: UserSchema },
      { name: Plan.name, schema: PlanSchema },
      { name: Order.name, schema: OrderSchema },
      { name: PaymentAuditLog.name, schema: PaymentAuditLogSchema },
    ]),
  ],
  controllers: [FinancialManagementController],
  providers: [
    FinancialManagementService,
    PaymentAuditService,
    AuditLogService,
    AdminAuthGuard,
    AdminRolesGuard,
  ],
  exports: [FinancialManagementService],
})
export class FinancialManagementModule {}
