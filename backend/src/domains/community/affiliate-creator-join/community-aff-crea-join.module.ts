import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunityAffCreaJoinController } from '@/domains/community/affiliate-creator-join/community-aff-crea-join.controller';
import { CommunityAffCreaJoinService } from '@/domains/community/affiliate-creator-join/community-aff-crea-join.service';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { CommunityStaff, CommunityStaffSchema } from '@/infrastructure/database/schemas/community/community-staff.schema';
import { UploadModule } from '@/domains/shared/upload/upload.module';
import { PolicyModule } from '@/shared/modules/policy.module';
import { FeeModule } from '@/shared/modules/fee.module';
import { PromoModule } from '@/shared/modules/promo.module';
import { OrderSchema } from '@/infrastructure/database/schemas/commerce/order.schema';
import { TrackingModule } from '@/shared/modules/tracking.module';
import { NotificationModule } from '@/domains/communication/notification/notification.module';
import { AuthModule } from '@/domains/auth/auth.module';
import { EmailCampaignModule } from '@/domains/communication/email-campaign/email-campaign.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Community.name, schema: CommunitySchema },
      { name: User.name, schema: UserSchema },
      { name: 'Order', schema: OrderSchema },
      { name: CommunityStaff.name, schema: CommunityStaffSchema },
    ]),
    UploadModule,
    PolicyModule,
    FeeModule,
    PromoModule,
    TrackingModule,
    NotificationModule,
    AuthModule,
    EmailCampaignModule,
  ],
  controllers: [CommunityAffCreaJoinController],
  providers: [CommunityAffCreaJoinService],
  exports: [CommunityAffCreaJoinService]
})
export class CommunityAffCreaJoinModule {}