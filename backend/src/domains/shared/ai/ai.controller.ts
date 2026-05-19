import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Get,
  Patch,
} from '@nestjs/common';
import { AiService } from '@/domains/shared/ai/ai.service';
import { AuthGuard } from '@nestjs/passport';
import { AskQuestionDto } from '@/domains/shared/ai/dto/ask-question.dto';
import {
  UpdateChapterTutorSettingsDto,
  UpdateCourseTutorSettingsDto,
} from '@/domains/shared/ai/dto/tutor-settings.dto';
import { CreateWithAiDto } from '@/domains/shared/ai/dto/create-with-ai.dto';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('courses/:courseId/chapters/:chapterId/ask')
  async askQuestion(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Body() body: AskQuestionDto,
    @Request() req: any,
  ) {
    return this.aiService.askChapterQuestion(
      courseId,
      chapterId,
      body.question,
      req?.user?._id,
      body.mode || 'chat',
    );
  }

  @Post('create-with-me')
  async createWithMe(@Body() body: CreateWithAiDto) {
    return this.aiService.createWithAi(body);
  }

  @Get('courses/:courseId/chapters/:chapterId/history')
  async getChapterHistory(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Request() req: any,
  ) {
    return this.aiService.getChapterHistory(
      courseId,
      chapterId,
      req?.user?._id,
    );
  }

  @Get('courses/:courseId/tutor-insights')
  async getTutorInsights(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    return this.aiService.getCourseTutorInsights(courseId, req?.user?._id);
  }

  @Patch('courses/:courseId/settings')
  async updateCourseSettings(
    @Param('courseId') courseId: string,
    @Body() body: UpdateCourseTutorSettingsDto,
    @Request() req: any,
  ) {
    return this.aiService.updateCourseTutorSettings(
      courseId,
      req?.user?._id,
      body.aiTutorEnabled ?? true,
    );
  }

  @Patch('courses/:courseId/chapters/:chapterId/settings')
  async updateChapterSettings(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Body() body: UpdateChapterTutorSettingsDto,
    @Request() req: any,
  ) {
    return this.aiService.updateChapterTutorSettings(
      courseId,
      chapterId,
      req?.user?._id,
      body.aiTutorEnabled ?? true,
    );
  }
}
