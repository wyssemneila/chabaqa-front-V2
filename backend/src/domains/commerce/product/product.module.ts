import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductService } from '@/domains/commerce/product/product.service';
import { ProductController } from '@/domains/commerce/product/product.controller';
import { Product, ProductSchema } from '@/infrastructure/database/schemas/commerce/product.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { AuthModule } from '@/domains/auth/auth.module';
import { FeeModule } from '@/shared/modules/fee.module';
import { TrackingModule } from '@/shared/modules/tracking.module';
import { OrderSchema } from '@/infrastructure/database/schemas/commerce/order.schema';
import { PolicyModule } from '@/shared/modules/policy.module';
import { PromoModule } from '@/shared/modules/promo.module';
import { UploadModule } from '@/domains/shared/upload/upload.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: User.name, schema: UserSchema },
      { name: 'Order', schema: OrderSchema }
    ]),
    AuthModule,
    FeeModule,
    TrackingModule,
    PolicyModule,
    PromoModule,
    UploadModule
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService]
})
export class ProductModule { }