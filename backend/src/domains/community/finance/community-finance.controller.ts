import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/domains/auth/guards/jwt-auth.guard';
import { CommunityPermissionGuard } from '@/domains/community/access/community-permission.guard';
import { RequireCommunityPermission } from '@/domains/community/access/community-permission.decorator';
import { CommunityPermission } from '@/shared/permissions';
import { CommunityFinanceService } from '@/domains/community/finance/community-finance.service';

@ApiTags('Community Finance')
@Controller('communities/:communityId/finance')
@UseGuards(JwtAuthGuard, CommunityPermissionGuard)
@ApiBearerAuth()
export class CommunityFinanceController {
  constructor(private readonly financeService: CommunityFinanceService) {}

  @Get('transactions/stats')
  @RequireCommunityPermission(CommunityPermission.FINANCE_VIEW)
  @ApiOperation({ summary: 'Community transaction aggregates' })
  async getTransactionStats(@Param('communityId') communityId: string) {
    return this.financeService.getTransactionStats(communityId);
  }

  @Get('transactions')
  @RequireCommunityPermission(CommunityPermission.FINANCE_VIEW)
  @ApiOperation({ summary: 'List community-scoped order transactions' })
  async getTransactions(
    @Param('communityId') communityId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.financeService.getTransactions(communityId, { page, limit, status, from, to });
  }
}
