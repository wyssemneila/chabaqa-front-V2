import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PromoService } from '@/shared/services/promo.service';
import { PromoCode, PromoCodeSchema } from '@/infrastructure/database/schemas/commerce/promo-code.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PromoCode.name, schema: PromoCodeSchema },
    ]),
  ],
  providers: [PromoService],
  exports: [PromoService],
})
export class PromoModule {}


