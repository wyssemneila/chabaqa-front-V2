import { Injectable } from '@nestjs/common';
import { AiTutorService } from '@/domains/shared/ai/ai-tutor.service';
import { AiTutorAnalyticsService } from '@/domains/shared/ai/ai-tutor-analytics.service';
import type { AiTutorMode } from '@/domains/shared/ai/ai-tutor.types';

/** Thin facade delegating to AiTutorService for backward compatibility. */
@Injectable()
export class AiService {
  constructor(
    private readonly tutorService: AiTutorService,
    private readonly analyticsService: AiTutorAnalyticsService,
  ) {}

  getChapterHistory(courseId: string, chapterId: string, userId: string) {
    return this.tutorService.getChapterHistory(courseId, chapterId, userId);
  }

  askChapterQuestion(
    courseId: string,
    chapterId: string,
    question: string | undefined,
    userId: unknown,
    mode?: AiTutorMode,
  ) {
    return this.tutorService.askChapter(
      courseId,
      chapterId,
      userId,
      question,
      mode || 'chat',
    );
  }

  updateCourseTutorSettings(
    courseId: string,
    userId: string,
    aiTutorEnabled: boolean,
  ) {
    return this.tutorService.updateCourseTutorSettings(
      courseId,
      userId,
      aiTutorEnabled,
    );
  }

  updateChapterTutorSettings(
    courseId: string,
    chapterId: string,
    userId: string,
    aiTutorEnabled: boolean,
  ) {
    return this.tutorService.updateChapterTutorSettings(
      courseId,
      chapterId,
      userId,
      aiTutorEnabled,
    );
  }

  getCourseTutorInsights(courseId: string, userId: string) {
    return this.analyticsService.getCourseTutorInsights(courseId, userId);
  }

}
