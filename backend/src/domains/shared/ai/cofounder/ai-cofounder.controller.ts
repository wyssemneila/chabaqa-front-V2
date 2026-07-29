import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiCofounderService } from './ai-cofounder.service';
import {
  BuildCommunityDto,
  CommunityFlowDto,
  CreateLaunchPlanDto,
  PublishDraftDto,
} from './dto/ai-cofounder.dto';

@ApiTags('AI Cofounder')
@Controller('ai/cofounder')
@UseGuards(AuthGuard('jwt'))
export class AiCofounderController {
  constructor(private readonly cofounderService: AiCofounderService) {}

  @Post('build-community')
  buildCommunity(@Body() body: BuildCommunityDto) {
    return this.cofounderService.buildCommunity(body);
  }

  @Post('onboarding-wizard')
  @ApiOperation({
    summary: 'AI onboarding wizard — generate community, first course, and launch plan',
    description: 'Takes a free-text creator description and returns a full onboarding payload: community draft + landing copy, course draft, and launch plan milestones.',
  })
  onboardingWizard(@Body() body: any, @Request() req: any) {
    return this.cofounderService.generateOnboardingFlow({
      creatorId: String(req.user._id),
      niche: String(body.niche || body.description || ''),
      audience: String(body.audience || ''),
      promise: String(body.promise || ''),
      price: Number(body.price) || 0,
      currency: String(body.currency || 'TND'),
    });
  }

  @Post('launch-plan')
  launchPlan(@Body() body: CreateLaunchPlanDto, @Request() req: any) {
    return this.cofounderService.createLaunchPlan(body, req.user._id);
  }

  @Post('fix-funnel')
  fixFunnel(@Body() body: CommunityFlowDto) {
    return this.cofounderService.fixFunnel(body.communityId);
  }

  @Post('grow')
  grow(@Body() body: CommunityFlowDto) {
    return this.cofounderService.grow(body.communityId);
  }

  @Post('publish-draft')
  publishDraft(@Body() body: PublishDraftDto) {
    return this.cofounderService.publishDraft(body);
  }
}
