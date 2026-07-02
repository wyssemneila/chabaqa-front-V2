import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/domains/auth/jwt-auth.guard';
import { DmBroadcastService } from '@/domains/communication/dm/dm-broadcast.service';
import { DmAutomationTrigger } from '@/infrastructure/database/schemas/communication/dm-automation.schema';

@ApiTags('Community DM Broadcasts')
@Controller('communities/:communityId/dm')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommunityDmBroadcastController {
  constructor(private readonly broadcastService: DmBroadcastService) {}

  private getUserId(req: any): string {
    return String(req.user?._id || req.user?.sub || req.user?.id || req.user?.userId || '');
  }

  @Get('broadcasts')
  @ApiOperation({ summary: 'List DM broadcasts for a community' })
  async listBroadcasts(@Param('communityId') communityId: string, @Request() req: any) {
    return this.broadcastService.listBroadcasts(communityId, this.getUserId(req));
  }

  @Post('broadcasts')
  @ApiOperation({ summary: 'Create a DM broadcast draft' })
  async createBroadcast(
    @Param('communityId') communityId: string,
    @Body() body: { title?: string; body: string },
    @Request() req: any,
  ) {
    return this.broadcastService.createBroadcast(this.getUserId(req), {
      communityId,
      title: body.title,
      body: body.body,
    });
  }

  @Post('broadcasts/:id/send')
  @ApiOperation({ summary: 'Send a DM broadcast to all community members' })
  async sendBroadcast(@Param('id') id: string, @Request() req: any) {
    return this.broadcastService.sendBroadcast(id, this.getUserId(req));
  }

  @Delete('broadcasts/:id')
  @ApiOperation({ summary: 'Delete a DM broadcast draft' })
  async deleteBroadcast(@Param('id') id: string, @Request() req: any) {
    return this.broadcastService.deleteBroadcast(id, this.getUserId(req));
  }

  @Get('automations')
  @ApiOperation({ summary: 'List DM automations for a community' })
  async listAutomations(@Param('communityId') communityId: string, @Request() req: any) {
    return this.broadcastService.listAutomations(communityId, this.getUserId(req));
  }

  @Post('automations')
  @ApiOperation({ summary: 'Create a DM automation' })
  async createAutomation(
    @Param('communityId') communityId: string,
    @Body()
    body: {
      name: string;
      trigger: DmAutomationTrigger;
      delayHours?: number;
      body: string;
    },
    @Request() req: any,
  ) {
    return this.broadcastService.createAutomation(this.getUserId(req), {
      communityId,
      ...body,
    });
  }

  @Patch('automations/:id/toggle')
  @ApiOperation({ summary: 'Toggle DM automation active state' })
  async toggleAutomation(@Param('id') id: string, @Request() req: any) {
    return this.broadcastService.toggleAutomation(id, this.getUserId(req));
  }

  @Delete('automations/:id')
  @ApiOperation({ summary: 'Delete a DM automation' })
  async deleteAutomation(@Param('id') id: string, @Request() req: any) {
    return this.broadcastService.deleteAutomation(id, this.getUserId(req));
  }
}
