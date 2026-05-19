import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiCofounderService } from './ai-cofounder.service';
import {
  BuildCommunityDto,
  CommunityFlowDto,
  CreateLaunchPlanDto,
  PublishDraftDto,
} from './dto/ai-cofounder.dto';

@Controller('ai/cofounder')
@UseGuards(AuthGuard('jwt'))
export class AiCofounderController {
  constructor(private readonly cofounderService: AiCofounderService) {}

  @Post('build-community')
  buildCommunity(@Body() body: BuildCommunityDto) {
    return this.cofounderService.buildCommunity(body);
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
