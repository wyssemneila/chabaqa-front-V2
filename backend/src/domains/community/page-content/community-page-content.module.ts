import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunityPageContentController } from '@/domains/community/page-content/community-page-content.controller';
import { CommunityPageContentService } from '@/domains/community/page-content/community-page-content.service';
import { 
  CommunityPageContent, 
  CommunityPageContentSchema 
} from '@/infrastructure/database/schemas/community/community-page-content.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { UploadModule } from '@/domains/shared/upload/upload.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CommunityPageContent.name, schema: CommunityPageContentSchema },
      { name: Community.name, schema: CommunitySchema },
    ]),
    UploadModule
  ],
  controllers: [CommunityPageContentController],
  providers: [CommunityPageContentService],
  exports: [CommunityPageContentService],
})
export class CommunityPageContentModule {}
