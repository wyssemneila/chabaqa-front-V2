import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { WalletService } from '@/domains/commerce/wallet/wallet.service';
import { WalletController } from '@/domains/commerce/wallet/wallet.controller';
import { WalletAdminController } from '@/domains/commerce/wallet/wallet-admin.controller';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { TopUpRequest, TopUpRequestSchema } from '@/infrastructure/database/schemas/commerce/topup-request.schema';
import { WalletTransaction, WalletTransactionSchema } from '@/infrastructure/database/schemas/commerce/wallet-transaction.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { Product, ProductSchema } from '@/infrastructure/database/schemas/commerce/product.schema';
import { Challenge, ChallengeSchema } from '@/infrastructure/database/schemas/learning/challenge.schema';
import { UploadModule } from '@/domains/shared/upload/upload.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: TopUpRequest.name, schema: TopUpRequestSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: Product.name, schema: ProductSchema },
      { name: Challenge.name, schema: ChallengeSchema },
    ]),
    MulterModule.register({
      dest: './uploads/topup-proofs',
    }),
    UploadModule,
  ],
  controllers: [WalletController, WalletAdminController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
