import { Module } from '@nestjs/common';
import { CommunityAffCreaJoinModule } from '@/domains/community/affiliate-creator-join/community-aff-crea-join.module';
import { CommunitiesModule } from '@/domains/community/communities/communities.module';
import { PostModule } from '@/domains/content/post/post.module';
import { NotificationModule } from '@/domains/communication/notification/notification.module';
import { DmModule } from '@/domains/communication/dm/dm.module';
import { LiveSupportModule } from '@/domains/communication/live-support/live-support.module';
import { CommunityPageContentModule } from '@/domains/community/page-content/community-page-content.module';

@Module({
  imports: [
    CommunityAffCreaJoinModule,
    CommunitiesModule,
    PostModule,
    NotificationModule,
    DmModule,
    LiveSupportModule,
    CommunityPageContentModule,
  ],
  exports: [
    CommunityAffCreaJoinModule,
    CommunitiesModule,
    PostModule,
    NotificationModule,
    DmModule,
    LiveSupportModule,
    CommunityPageContentModule,
  ],
})
export class CommunityDomainModule {}
