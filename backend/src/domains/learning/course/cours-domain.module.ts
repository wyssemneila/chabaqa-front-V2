import { Module } from '@nestjs/common';
import { CoursModule } from '@/domains/learning/course/cours.module';

@Module({
  imports: [CoursModule],
  exports: [CoursModule],
})
export class CoursDomainModule {}
