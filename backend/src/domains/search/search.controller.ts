import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SearchService } from '@/domains/search/search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Cross-entity search across communities, courses, products, events, and posts' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'type', required: false, enum: ['all', 'community', 'course', 'product', 'event', 'post'] })
  @ApiQuery({ name: 'mode', required: false, enum: ['keyword', 'semantic'] })
  @ApiQuery({ name: 'communityId', required: false, type: String })
  async search(
    @Query('q') q: string,
    @Query('type') type = 'all',
    @Query('mode') mode = 'keyword',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
    @Query('communityId') communityId?: string,
  ) {
    return this.searchService.search({ q, type, mode, communityId, page, limit });
  }

  @Get('health')
  @ApiOperation({ summary: 'Search backend status' })
  async health() {
    return this.searchService.health();
  }
}
