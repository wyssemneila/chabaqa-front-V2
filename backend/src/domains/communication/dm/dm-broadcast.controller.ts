import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/domains/auth/jwt-auth.guard';
import { DmBroadcastService } from '@/domains/communication/dm/dm-broadcast.service';
import { DmAutomationTrigger } from '@/infrastructure/database/schemas/communication/dm-automation.schema';

@ApiTags('DM Broadcasts')
@Controller('dm')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DmBroadcastController {
  constructor(private readonly broadcastService: DmBroadcastService) {}

  private getUserId(req: any): string {
    return String(req.user?._id || req.user?.sub || req.user?.id || '');
  }

  @Get('broadcasts')
  @ApiOperation({ summary: 'List DM broadcasts for a community' })
  async listBroadcasts(@Query('communityId') communityId: string, @Request() req: any) {
    return this.broadcastService.listBroadcasts(communityId, this.getUserId(req));
  }

  @Post('broadcasts')
  @ApiOperation({ summary: 'Create a DM broadcast draft' })
  async createBroadcast(
    @Body() body: { communityId: string; title?: string; body: string },
    @Request() req: any,
  ) {
    return this.broadcastService.createBroadcast(this.getUserId(req), body);
  }

  @Get('broadcasts/:id')
  @ApiOperation({ summary: 'Get a DM broadcast' })
  async getBroadcast(@Param('id') id: string, @Request() req: any) {
    return this.broadcastService.getBroadcast(id, this.getUserId(req));
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
  async listAutomations(@Query('communityId') communityId: string, @Request() req: any) {
    return this.broadcastService.listAutomations(communityId, this.getUserId(req));
  }

  @Post('automations')
  @ApiOperation({ summary: 'Create a DM automation' })
  async createAutomation(
    @Body()
    body: {
      communityId: string;
      name: string;
      trigger: DmAutomationTrigger;
      delayHours?: number;
      body: string;
    },
    @Request() req: any,
  ) {
    return this.broadcastService.createAutomation(this.getUserId(req), body);
  }

  @Patch('automations/:id')
  @ApiOperation({ summary: 'Update a DM automation' })
  async updateAutomation(
    @Param('id') id: string,
    @Body()
    body: Partial<{ name: string; trigger: DmAutomationTrigger; delayHours: number; body: string; isActive: boolean }>,
    @Request() req: any,
  ) {
    return this.broadcastService.updateAutomation(id, this.getUserId(req), body);
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
