import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PlaybackSession,
  PlaybackSessionSchema,
} from '@/infrastructure/database/schemas/shared/playback-session.schema';
import { ChapterAccessModule } from '@/shared/modules/chapter-access.module';
import { VideoPlaybackService } from '@/domains/shared/video/video-playback.service';
import { VideoController } from '@/domains/shared/video/video.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlaybackSession.name, schema: PlaybackSessionSchema },
    ]),
    ChapterAccessModule,
  ],
  controllers: [VideoController],
  providers: [VideoPlaybackService],
  exports: [VideoPlaybackService],
})
export class VideoModule {}
