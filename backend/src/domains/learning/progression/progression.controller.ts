import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/domains/auth/guards/jwt-auth.guard';
import { ProgressionService } from '@/domains/learning/progression/progression.service';
import { GetProgressionOverviewDto } from '@/domains/learning/progression/dto/get-progression-overview.dto';
import { ProgressionOverviewDto } from '@/domains/learning/progression/dto/progression-item.dto';

@ApiTags('Progression')
@Controller('progression')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProgressionController {
  constructor(private readonly progressionService: ProgressionService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Récupérer la progression globale de l’utilisateur',
    description: 'Retourne une vue unifiée des progressions pour tous les contenus communautaires.',
  })
  async getOverview(
    @Request() req: any,
    @Query() query: GetProgressionOverviewDto,
  ): Promise<ProgressionOverviewDto> {
    const userId = req.user._id || req.user.userId;
    return this.progressionService.getUserProgressOverview(userId, query);
  }
}

