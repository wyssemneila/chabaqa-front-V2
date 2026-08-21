import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayoutController } from '@/domains/commerce/payout/payout.controller';
import { PayoutService } from '@/domains/commerce/payout/payout.service';
import { Payout, PayoutSchema } from '@/infrastructure/database/schemas/commerce/payout.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { Order, OrderSchema } from '@/infrastructure/database/schemas/commerce/order.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payout.name, schema: PayoutSchema },
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Community.name, schema: CommunitySchema },
    ])
  ],
  controllers: [PayoutController],
  providers: [PayoutService],
  exports: [PayoutService]
})
export class PayoutModule { }