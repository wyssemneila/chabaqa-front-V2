import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UploadModule } from '@/domains/shared/upload/upload.module';
import { MediaController } from '@/domains/content/media/media.controller';
import { MediaService } from '@/domains/content/media/media.service';
import { DiskStorageAdapter } from '@/domains/content/media/storage/disk-storage.adapter';
import { S3StorageAdapter } from '@/domains/content/media/storage/s3-storage.adapter';
import { MediaAsset, MediaAssetSchema } from '@/infrastructure/database/schemas/content/media-asset.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MediaAsset.name, schema: MediaAssetSchema }]),
    UploadModule,
  ],
  controllers: [MediaController],
  providers: [MediaService, DiskStorageAdapter, S3StorageAdapter],
  exports: [MediaService, MongooseModule],
})
export class MediaModule {}

