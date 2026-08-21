import {
  Controller, Post, Get, Patch, Body, Param, Query, Req,
  UseGuards, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/domains/auth/guards/jwt-auth.guard';
import { AffiliateService } from '@/domains/community/affiliate/affiliate.service';
import { CommunityPermissionGuard } from '@/domains/community/access/community-permission.guard';
import { RequireCommunityPermission, OptionalCommunityPermission, CommunityIdFrom } from '@/domains/community/access/community-permission.decorator';
import { CommunityPermission } from '@/shared/permissions';
import {
  CreateProgramDto, UpdateProgramDto, InvitePartnerDto,
  UpdatePartnerDto, CreateLinkDto,
  AffiliateMarketingQueryDto, AffiliateCommissionPreviewDto,
} from '@/domains/community/affiliate/dto/affiliate.dto';

@ApiTags('Affiliate – Creator')
@Controller('affiliate/creator')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AffiliateCreatorController {
  private readonly logger = new Logger(AffiliateCreatorController.name);

  constructor(private readonly affiliateService: AffiliateService) {}

  private getUserId(req: any): string {
    return (req.user?._id || req.user?.sub || '').toString();
  }

  // ── Programs ──

  @Post('programs')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.AFFILIATES_MANAGE)
  @ApiOperation({ summary: 'Create an affiliate program' })
  async createProgram(@Req() req: any, @Body() dto: CreateProgramDto) {
    return this.affiliateService.createProgram(this.getUserId(req), dto);
  }

  @Get('programs')
  @ApiOperation({ summary: 'List creator affiliate programs' })
  async getPrograms(@Req() req: any) {
    return this.affiliateService.getCreatorPrograms(this.getUserId(req));
  }

  @Patch('programs/:id')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.AFFILIATES_MANAGE)
  @CommunityIdFrom({ type: 'entity', modelName: 'AffiliateProgram', paramName: 'id' })
  @OptionalCommunityPermission()
  @ApiOperation({ summary: 'Update a program (pause/change rate)' })
  async updateProgram(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProgramDto) {
    return this.affiliateService.updateProgram(this.getUserId(req), id, dto);
  }

  // ── Partners ──

  @Post('programs/:id/partners')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.AFFILIATES_MANAGE)
  @CommunityIdFrom({ type: 'entity', modelName: 'AffiliateProgram', paramName: 'id' })
  @OptionalCommunityPermission()
  @ApiOperation({ summary: 'Invite a partner to a program' })
  async invitePartner(@Req() req: any, @Param('id') programId: string, @Body() dto: InvitePartnerDto) {
    return this.affiliateService.invitePartner(this.getUserId(req), programId, dto);
  }

  @Get('partners')
  @ApiOperation({ summary: 'List partners across programs' })
  async getPartners(@Req() req: any, @Query('programId') programId?: string) {
    return this.affiliateService.getCreatorPartners(this.getUserId(req), programId);
  }

  @Patch('partners/:id')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.AFFILIATES_MANAGE)
  @CommunityIdFrom({ type: 'entity', modelName: 'AffiliatePartner', paramName: 'id' })
  @OptionalCommunityPermission()
  @ApiOperation({ summary: 'Approve/reject/pause a partner' })
  async updatePartner(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    return this.affiliateService.updatePartnerStatus(this.getUserId(req), id, dto);
  }

  // ── Links ──

  @Post('links')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.AFFILIATES_MANAGE)
  @CommunityIdFrom({ type: 'entity', modelName: 'AffiliateProgram', paramName: 'programId' })
  @OptionalCommunityPermission()
  @ApiOperation({ summary: 'Create a share link for a partner' })
  async createLink(@Req() req: any, @Body() dto: CreateLinkDto) {
    return this.affiliateService.createLink(this.getUserId(req), dto);
  }

  // ── Stats ──

  @Get('stats')
  @ApiOperation({ summary: 'Creator affiliate stats (clicks, conversions, revenue, top partners)' })
  async getStats(@Req() req: any, @Query() query: AffiliateMarketingQueryDto) {
    return this.affiliateService.getCreatorStats(this.getUserId(req), query);
  }

  @Get('marketing')
  @UseGuards(CommunityPermissionGuard)
  @RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
  @OptionalCommunityPermission()
  @ApiOperation({
    summary: 'Rich affiliate marketing intelligence',
    description:
      'Returns precise affiliate funnel, partner, link, UTM, device, payout-health, merge-field, and backend template data for the future affiliate UI.',
  })
  async getMarketingData(@Req() req: any, @Query() query: AffiliateMarketingQueryDto) {
    return this.affiliateService.getCreatorMarketingData(this.getUserId(req), query);
  }

  @Post('commission-preview')
  @ApiOperation({ summary: 'Preview affiliate commission math before saving a program or offer' })
  async previewCommission(@Req() req: any, @Body() dto: AffiliateCommissionPreviewDto) {
    return this.affiliateService.previewAffiliateCommission(this.getUserId(req), dto);
  }
}
