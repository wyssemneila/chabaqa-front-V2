import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/domains/auth/guards/jwt-auth.guard';
import { CommunityPermissionGuard } from '@/domains/community/access/community-permission.guard';
import { RequireCommunityPermission } from '@/domains/community/access/community-permission.decorator';
import { CommunityPermission } from '@/shared/permissions';
import { CommunityModerationService } from '@/domains/community/moderation/community-moderation.service';

@ApiTags('Community Moderation')
@Controller('communities/:communityId/moderation')
@UseGuards(JwtAuthGuard, CommunityPermissionGuard)
@ApiBearerAuth()
export class CommunityModerationController {
  constructor(private readonly moderationService: CommunityModerationService) {}

  @Get('queue')
  @RequireCommunityPermission(CommunityPermission.POSTS_MODERATE)
  @ApiOperation({ summary: 'Moderation queue for a community' })
  async getQueue(
    @Param('communityId') communityId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.moderationService.getQueue(communityId, { page, limit, status });
  }

  @Get('stats')
  @RequireCommunityPermission(CommunityPermission.POSTS_MODERATE)
  @ApiOperation({ summary: 'Moderation aggregate stats' })
  async getStats(@Param('communityId') communityId: string) {
    return this.moderationService.getStats(communityId);
  }

  @Get('activity')
  @RequireCommunityPermission(CommunityPermission.POSTS_MODERATE)
  @ApiOperation({ summary: 'Recent moderation activity' })
  async getActivity(
    @Param('communityId') communityId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return { items: await this.moderationService.getActivity(communityId, limit) };
  }

  @Get('flagged-users')
  @RequireCommunityPermission(CommunityPermission.POSTS_MODERATE)
  @ApiOperation({ summary: 'Users with flagged content in community' })
  async getFlaggedUsers(@Param('communityId') communityId: string) {
    return { items: await this.moderationService.getFlaggedUsers(communityId) };
  }
}
