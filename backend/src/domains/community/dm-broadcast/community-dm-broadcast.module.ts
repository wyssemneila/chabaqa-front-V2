import { Module } from '@nestjs/common';
import { CommunityDmBroadcastController } from '@/domains/community/dm-broadcast/community-dm-broadcast.controller';
import { DmModule } from '@/domains/communication/dm/dm.module';

@Module({
  imports: [DmModule],
  controllers: [CommunityDmBroadcastController],
})
export class CommunityDmBroadcastModule {}
