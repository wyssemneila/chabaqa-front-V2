import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunityFinanceController } from '@/domains/community/finance/community-finance.controller';
import { CommunityFinanceService } from '@/domains/community/finance/community-finance.service';
import { Order, OrderSchema } from '@/infrastructure/database/schemas/commerce/order.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CommunityFinanceController],
  providers: [CommunityFinanceService],
  exports: [CommunityFinanceService],
})
export class CommunityFinanceModule {}
