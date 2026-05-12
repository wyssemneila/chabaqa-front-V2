import { Module } from '@nestjs/common';
import { PostModule } from '@/domains/content/post/post.module';
import { ResourceModule } from '@/domains/content/resource/resource.module';
import { MediaModule } from '@/domains/content/media/media.module';
import { FeedbackModule } from '@/domains/content/feedback/feedback.module';

@Module({
  imports: [PostModule, ResourceModule, MediaModule, FeedbackModule],
  exports: [PostModule, ResourceModule, MediaModule, FeedbackModule],
})
export class ContentModule {}
