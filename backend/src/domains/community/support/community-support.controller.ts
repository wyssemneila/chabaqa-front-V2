import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Request,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/domains/auth/guards/jwt-auth.guard';
import { CommunityPermissionGuard } from '@/domains/community/access/community-permission.guard';
import { RequireCommunityPermission } from '@/domains/community/access/community-permission.decorator';
import { CommunityPermission } from '@/shared/permissions';
import { CommunitySupportService } from '@/domains/community/support/community-support.service';

@ApiTags('Community Support')
@Controller('communities/:communityId/support')
@UseGuards(JwtAuthGuard, CommunityPermissionGuard)
@ApiBearerAuth()
export class CommunitySupportController {
  constructor(private readonly supportService: CommunitySupportService) {}

  @Get('queue')
  @RequireCommunityPermission(CommunityPermission.SUPPORT_MANAGE)
  @ApiOperation({ summary: 'Community support conversation queue' })
  async getQueue(
    @Param('communityId') communityId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: 'open' | 'closed',
  ) {
    return this.supportService.getQueue(communityId, { page, limit, status });
  }

  @Get('metrics')
  @RequireCommunityPermission(CommunityPermission.SUPPORT_MANAGE)
  @ApiOperation({ summary: 'Community support metrics' })
  async getMetrics(@Param('communityId') communityId: string) {
    return this.supportService.getMetrics(communityId);
  }

  @Patch(':conversationId/assign')
  @RequireCommunityPermission(CommunityPermission.SUPPORT_MANAGE)
  @ApiOperation({ summary: 'Assign support conversation to staff member' })
  async assign(
    @Param('communityId') communityId: string,
    @Param('conversationId') conversationId: string,
    @Request() req: any,
  ) {
    const assigneeId = String(req.user?._id || req.user?.sub);
    return this.supportService.assignConversation(communityId, conversationId, assigneeId);
  }
}
