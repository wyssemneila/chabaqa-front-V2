import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/domains/auth/guards/jwt-auth.guard';
import { CreatorWritingService } from './creator-writing.service';
import { GenerateCreatorFieldDto } from './dto/generate-creator-field.dto';

@ApiTags('Creator Writing Assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('creator-writing')
export class CreatorWritingController {
  constructor(private readonly service: CreatorWritingService) {}
  @Post('communities/:communityId/generate')
  async generate(@Param('communityId') communityId: string, @Body() dto: GenerateCreatorFieldDto, @Request() req: any) {
    return { success: true, data: await this.service.generate(communityId, String(req.user?._id || req.user?.sub), dto) };
  }
  @Get('usage')
  async usage(@Request() req: any) {
    return { success: true, data: await this.service.usage(String(req.user?._id || req.user?.sub)) };
  }
}
