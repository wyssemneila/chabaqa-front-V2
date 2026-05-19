import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiSettingsService } from './ai-settings.service';
import { AiUsageService } from './ai-usage.service';
import { UpdateAiSettingsDto } from './dto/update-ai-settings.dto';

@Controller('communities/:id/ai')
@UseGuards(AuthGuard('jwt'))
export class AiSettingsController {
  constructor(
    private readonly aiSettingsService: AiSettingsService,
    private readonly aiUsageService: AiUsageService,
  ) {}

  @Get('settings')
  async getSettings(@Param('id') communityId: string) {
    return this.aiSettingsService.getSettings(communityId);
  }

  @Patch('settings')
  async updateSettings(
    @Param('id') communityId: string,
    @Body() updateAiSettingsDto: UpdateAiSettingsDto,
    @Request() req: any,
  ) {
    return this.aiSettingsService.updateSettings(
      communityId,
      updateAiSettingsDto,
      req.user._id,
    );
  }

  @Get('usage')
  async getUsage(@Param('id') communityId: string) {
    return this.aiUsageService.getUsage(communityId);
  }
}
