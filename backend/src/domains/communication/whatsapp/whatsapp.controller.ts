import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/domains/auth/jwt-auth.guard';
import { CommunityPermissionGuard } from '@/domains/community/access/community-permission.guard';
import { CommunityIdFrom, RequireCommunityPermission } from '@/domains/community/access/community-permission.decorator';
import { CommunityPermission } from '@/shared/permissions';
import {
  CreateWhatsappAutomationDto,
  CreateWhatsappCampaignDto,
  ImportWhatsappContactsDto,
  RenderWhatsappPreviewDto,
  UpdateWhatsappAutomationDto,
  UpdateWhatsappCampaignDto,
  WhatsappAudiencePreviewDto,
  WhatsappCampaignQueryDto,
} from '@/domains/communication/whatsapp/dto/whatsapp-campaign.dto';
import { WhatsappService } from '@/domains/communication/whatsapp/whatsapp.service';
import { WhatsappAiService } from '@/domains/communication/whatsapp/whatsapp-ai.service';

@Controller('whatsapp-campaigns')
@UseGuards(JwtAuthGuard)
@ApiTags('WhatsApp Campaigns')
@ApiBearerAuth()
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly whatsappAiService: WhatsappAiService,
  ) {}

  @Post()
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @CommunityIdFrom({ type: 'body', name: 'communityId' })
  @ApiOperation({ summary: 'Create WhatsApp campaign' })
  createCampaign(@Request() req, @Body() dto: CreateWhatsappCampaignDto) {
    return this.whatsappService.createCampaign(req.user._id, dto);
  }

  @Get('community/:communityId')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @CommunityIdFrom({ type: 'param', name: 'communityId' })
  @ApiOperation({ summary: 'List WhatsApp campaigns for a community' })
  listCampaigns(@Request() req, @Param('communityId') communityId: string, @Query() query: WhatsappCampaignQueryDto) {
    return this.whatsappService.listCampaigns(req.user._id, communityId, query);
  }

  @Get('community/:communityId/stats')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @CommunityIdFrom({ type: 'param', name: 'communityId' })
  @ApiOperation({ summary: 'Get WhatsApp campaign stats for a community' })
  getStats(@Request() req, @Param('communityId') communityId: string) {
    return this.whatsappService.getCampaignStats(req.user._id, communityId);
  }

  @Get(':campaignId')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @CommunityIdFrom({ type: 'entity', modelName: 'WhatsappCampaign', paramName: 'campaignId' })
  @ApiOperation({ summary: 'Get WhatsApp campaign' })
  getCampaign(@Request() req, @Param('campaignId') campaignId: string) {
    return this.whatsappService.getCampaign(campaignId, req.user._id);
  }

  @Patch(':campaignId')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @CommunityIdFrom({ type: 'entity', modelName: 'WhatsappCampaign', paramName: 'campaignId' })
  @ApiOperation({ summary: 'Update WhatsApp campaign' })
  updateCampaign(
    @Request() req,
    @Param('campaignId') campaignId: string,
    @Body() dto: UpdateWhatsappCampaignDto,
  ) {
    return this.whatsappService.updateCampaign(campaignId, req.user._id, dto);
  }

  @Delete(':campaignId')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @CommunityIdFrom({ type: 'entity', modelName: 'WhatsappCampaign', paramName: 'campaignId' })
  @ApiOperation({ summary: 'Delete WhatsApp campaign' })
  deleteCampaign(@Request() req, @Param('campaignId') campaignId: string) {
    return this.whatsappService.deleteCampaign(campaignId, req.user._id);
  }

  @Post(':campaignId/send')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @CommunityIdFrom({ type: 'entity', modelName: 'WhatsappCampaign', paramName: 'campaignId' })
  @ApiOperation({ summary: 'Queue WhatsApp campaign for sending' })
  sendCampaign(@Request() req, @Param('campaignId') campaignId: string) {
    return this.whatsappService.sendCampaign(campaignId, req.user._id);
  }

  @Post(':campaignId/cancel')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @CommunityIdFrom({ type: 'entity', modelName: 'WhatsappCampaign', paramName: 'campaignId' })
  @ApiOperation({ summary: 'Cancel WhatsApp campaign' })
  async cancelCampaign(@Request() req, @Param('campaignId') campaignId: string) {
    await this.whatsappService.cancelCampaign(campaignId, req.user._id);
    return { message: 'WhatsApp campaign cancelled successfully', campaignId };
  }

  @Post(':campaignId/duplicate')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @CommunityIdFrom({ type: 'entity', modelName: 'WhatsappCampaign', paramName: 'campaignId' })
  @ApiOperation({ summary: 'Duplicate WhatsApp campaign' })
  duplicateCampaign(@Request() req, @Param('campaignId') campaignId: string, @Body() body: { title?: string }) {
    return this.whatsappService.duplicateCampaign(campaignId, req.user._id, body.title);
  }

  @Get(':campaignId/recipients')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @CommunityIdFrom({ type: 'entity', modelName: 'WhatsappCampaign', paramName: 'campaignId' })
  @ApiOperation({ summary: 'Get WhatsApp campaign recipients' })
  getRecipients(
    @Request() req,
    @Param('campaignId') campaignId: string,
    @Query() query: { page?: number; limit?: number; status?: string },
  ) {
    return this.whatsappService.getCampaignRecipients(campaignId, req.user._id, query);
  }

  @Post('render-preview')
  @ApiOperation({ summary: 'Render WhatsApp message preview' })
  renderPreview(@Body() dto: RenderWhatsappPreviewDto) {
    return this.whatsappService.renderPreview(dto);
  }

  @Post('community/:communityId/contacts/import')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @CommunityIdFrom({ type: 'param', name: 'communityId' })
  @ApiOperation({ summary: 'Import opted-in WhatsApp contacts' })
  importContacts(@Param('communityId') communityId: string, @Body() dto: ImportWhatsappContactsDto) {
    return this.whatsappService.importContacts(communityId, dto);
  }

  @Get('community/:communityId/contacts')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @CommunityIdFrom({ type: 'param', name: 'communityId' })
  @ApiOperation({ summary: 'List WhatsApp contacts for a community' })
  listContacts(@Param('communityId') communityId: string) {
    return this.whatsappService.listContacts(communityId);
  }

  @Post('community/:communityId/contacts/:contactId/opt-out')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @CommunityIdFrom({ type: 'param', name: 'communityId' })
  @ApiOperation({ summary: 'Opt out a WhatsApp contact' })
  optOutContact(@Param('communityId') communityId: string, @Param('contactId') contactId: string) {
    return this.whatsappService.optOutContact(communityId, contactId);
  }

  @Post('community/:communityId/audience/preview')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @CommunityIdFrom({ type: 'param', name: 'communityId' })
  @ApiOperation({ summary: 'Preview eligible WhatsApp audience' })
  previewAudience(@Request() req, @Param('communityId') communityId: string, @Body() dto: WhatsappAudiencePreviewDto) {
    return this.whatsappService.previewAudience(
      req.user._id,
      communityId,
      dto.targetAudience,
      dto.customAudienceIds || [],
      dto.limit || 100,
    );
  }

  @Get('community/:communityId/automations')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @CommunityIdFrom({ type: 'param', name: 'communityId' })
  @ApiOperation({ summary: 'List WhatsApp automations for a community' })
  listAutomations(@Request() req, @Param('communityId') communityId: string) {
    return this.whatsappService.listAutomations(req.user._id, communityId);
  }

  @Post('community/:communityId/ai-broadcast-draft')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @CommunityIdFrom({ type: 'param', name: 'communityId' })
  @ApiOperation({
    summary: 'Draft a WhatsApp broadcast message with AI',
    description: 'Generates a broadcast message + 2 variants from a goal, audience, and tone using the configured LLM. Returns skipped:true if AI is disabled.',
  })
  async aiBroadcastDraft(
    @Param('communityId') communityId: string,
    @Body() dto: { goal: string; audience?: string; tone?: string; context?: string },
  ) {
    return this.whatsappAiService.generateBroadcastDraft({
      communityId,
      goal: dto.goal,
      audience: dto.audience,
      tone: dto.tone,
      context: dto.context,
    });
  }

  @Get('community/:communityId/ai-status')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @CommunityIdFrom({ type: 'param', name: 'communityId' })
  @ApiOperation({ summary: 'Check WhatsApp AI feature availability' })
  aiStatus() {
    return {
      enabled: this.whatsappAiService.isEnabled(),
      autoReplyEnabled: this.whatsappAiService.isAutoReplyEnabled(),
    };
  }

  @Post('community/:communityId/automations')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @CommunityIdFrom({ type: 'param', name: 'communityId' })
  @ApiOperation({ summary: 'Create WhatsApp automation' })
  createAutomation(
    @Request() req,
    @Param('communityId') communityId: string,
    @Body() dto: CreateWhatsappAutomationDto,
  ) {
    return this.whatsappService.createAutomation(req.user._id, communityId, dto);
  }

  @Patch('community/:communityId/automations/:automationId')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @CommunityIdFrom({ type: 'param', name: 'communityId' })
  @ApiOperation({ summary: 'Update WhatsApp automation' })
  updateAutomation(
    @Request() req,
    @Param('communityId') communityId: string,
    @Param('automationId') automationId: string,
    @Body() dto: UpdateWhatsappAutomationDto,
  ) {
    return this.whatsappService.updateAutomation(req.user._id, communityId, automationId, dto);
  }

  @Delete('community/:communityId/automations/:automationId')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @CommunityIdFrom({ type: 'param', name: 'communityId' })
  @ApiOperation({ summary: 'Delete WhatsApp automation' })
  deleteAutomation(
    @Request() req,
    @Param('communityId') communityId: string,
    @Param('automationId') automationId: string,
  ) {
    return this.whatsappService.deleteAutomation(req.user._id, communityId, automationId);
  }
}
