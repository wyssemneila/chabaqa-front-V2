import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AffiliateProgram, AffiliateProgramSchema } from '@/domains/community/affiliate/schemas/affiliate-program.schema';
import { AffiliatePartner, AffiliatePartnerSchema } from '@/domains/community/affiliate/schemas/affiliate-partner.schema';
import { AffiliateLink, AffiliateLinkSchema } from '@/domains/community/affiliate/schemas/affiliate-link.schema';
import { AffiliateClick, AffiliateClickSchema } from '@/domains/community/affiliate/schemas/affiliate-click.schema';
import { AffiliateConversion, AffiliateConversionSchema } from '@/domains/community/affiliate/schemas/affiliate-conversion.schema';
import { AffiliatePayoutRequest, AffiliatePayoutRequestSchema } from '@/domains/community/affiliate/schemas/affiliate-payout-request.schema';
import { AffiliateService } from '@/domains/community/affiliate/affiliate.service';
import { AffiliateAttributionService } from '@/domains/community/affiliate/affiliate-attribution.service';
import { AffiliateCommissionService } from '@/domains/community/affiliate/affiliate-commission.service';
import { AffiliatePayoutService } from '@/domains/community/affiliate/affiliate-payout.service';
import { AffiliateCreatorController } from '@/domains/community/affiliate/affiliate.controller';
import { AffiliatePartnerController } from '@/domains/community/affiliate/affiliate-partner.controller';
import { AffiliateAdminController } from '@/domains/community/affiliate/affiliate-admin.controller';
import { AffiliateRedirectController } from '@/domains/community/affiliate/affiliate-redirect.controller';
import { Order, OrderSchema } from '@/infrastructure/database/schemas/commerce/order.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { CommunityAccessModule } from '@/domains/community/access/community-access.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CommunityAccessModule,
    MongooseModule.forFeature([
      { name: AffiliateProgram.name, schema: AffiliateProgramSchema },
      { name: AffiliatePartner.name, schema: AffiliatePartnerSchema },
      { name: AffiliateLink.name, schema: AffiliateLinkSchema },
      { name: AffiliateClick.name, schema: AffiliateClickSchema },
      { name: AffiliateConversion.name, schema: AffiliateConversionSchema },
      { name: AffiliatePayoutRequest.name, schema: AffiliatePayoutRequestSchema },
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [
    AffiliateCreatorController,
    AffiliatePartnerController,
    AffiliateAdminController,
    AffiliateRedirectController,
  ],
  providers: [
    AffiliateService,
    AffiliateAttributionService,
    AffiliateCommissionService,
    AffiliatePayoutService,
  ],
  exports: [
    AffiliateAttributionService,
    AffiliateCommissionService,
  ],
})
export class AffiliateModule {}
