import { Module } from '@nestjs/common';
import { UploadModule } from '@/domains/shared/upload/upload.module';
import { VideoModule } from '@/domains/shared/video/video.module';
import { AchievementModule } from '@/domains/shared/achievement/achievement.module';
import { AiModule } from '@/domains/shared/ai/ai.module';

@Module({
  imports: [UploadModule, VideoModule, AchievementModule, AiModule],
  exports: [UploadModule, VideoModule, AchievementModule, AiModule],
})
export class SharedDomainModule {}
