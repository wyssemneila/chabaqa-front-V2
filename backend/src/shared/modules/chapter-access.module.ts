import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Cours,
  CoursSchema,
  CourseEnrollment,
  CourseEnrollmentSchema,
} from '@/infrastructure/database/schemas/learning/course.schema';
import { Order, OrderSchema } from '@/infrastructure/database/schemas/commerce/order.schema';
import { ChapterAccessService } from '@/shared/services/chapter-access.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cours.name, schema: CoursSchema },
      { name: CourseEnrollment.name, schema: CourseEnrollmentSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  providers: [ChapterAccessService],
  exports: [ChapterAccessService],
})
export class ChapterAccessModule {}
