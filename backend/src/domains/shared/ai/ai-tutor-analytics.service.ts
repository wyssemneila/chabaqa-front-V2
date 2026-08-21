import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CoursService } from '@/domains/learning/course/cours.service';
import {
  AiChapterConversation,
  AiChapterConversationDocument,
} from '@/infrastructure/database/schemas/learning/ai-chapter-conversation.schema';
import {
  Cours,
  CoursDocument,
} from '@/infrastructure/database/schemas/learning/course.schema';
import { ConfigService } from '@nestjs/config';
import type {
  TutorChapterInsight,
  TutorCourseInsights,
} from '@/domains/shared/ai/ai-tutor.types';

@Injectable()
export class AiTutorAnalyticsService {
  private readonly confusingThreshold: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly coursService: CoursService,
    @InjectModel(AiChapterConversation.name)
    private readonly conversationModel: Model<AiChapterConversationDocument>,
    @InjectModel(Cours.name)
    private readonly coursModel: Model<CoursDocument>,
  ) {
    const raw = Number(
      this.configService.get<string>('AI_TUTOR_CONFUSING_THRESHOLD') || 10,
    );
    this.confusingThreshold = Number.isFinite(raw) && raw > 0 ? raw : 10;
  }

  async getCourseTutorInsights(
    courseId: string,
    userId: string,
  ): Promise<TutorCourseInsights> {
    await this.assertCourseCreator(courseId, userId);
    const course = await this.coursService.obtenirCours(courseId);
    if (!course) throw new NotFoundException('Course not found');

    const chapterMeta = new Map<
      string,
      { chapterTitle: string; sectionTitle: string }
    >();
    for (const section of course.sections || []) {
      const sectionTitle = String(section.titre ?? '');
      for (const ch of section.chapitres || []) {
        chapterMeta.set(String(ch.id), {
          chapterTitle: String(ch.titre ?? 'Chapter'),
          sectionTitle,
        });
      }
    }

    const rows = await this.conversationModel
      .aggregate([
        { $match: { courseId: String(courseId) } },
        { $unwind: '$messages' },
        {
          $facet: {
            userMessages: [
              { $match: { 'messages.role': 'user' } },
              {
                $group: {
                  _id: {
                    chapterId: '$chapterId',
                    normalized: {
                      $toLower: {
                        $substrCP: [
                          { $trim: { input: '$messages.content' } },
                          0,
                          200,
                        ],
                      },
                    },
                  },
                  count: { $sum: 1 },
                  sampleText: { $first: '$messages.content' },
                  intents: { $push: '$messages.intent' },
                  userIds: { $addToSet: '$userId' },
                  lastAt: { $max: '$messages.createdAt' },
                },
              },
            ],
            chapterTotals: [
              { $match: { 'messages.role': 'user' } },
              {
                $group: {
                  _id: '$chapterId',
                  totalQuestions: { $sum: 1 },
                  uniqueLearners: { $addToSet: '$userId' },
                  lastAt: { $max: '$messages.createdAt' },
                  intents: { $push: '$messages.intent' },
                },
              },
            ],
          },
        },
      ])
      .exec();

    const facet = rows[0] || { userMessages: [], chapterTotals: [] };
    const topByChapter = new Map<
      string,
      Array<{ text: string; count: number }>
    >();
    for (const row of facet.userMessages || []) {
      const chapterId = String(row._id?.chapterId || '');
      if (!chapterId) continue;
      const list = topByChapter.get(chapterId) || [];
      list.push({
        text: String(row.sampleText || '').trim().slice(0, 300),
        count: Number(row.count) || 1,
      });
      topByChapter.set(chapterId, list);
    }

    const chapters: TutorChapterInsight[] = [];
    const totalsMap = new Map<string, any>();
    for (const t of facet.chapterTotals || []) {
      totalsMap.set(String(t._id), t);
    }

    const allChapterIds = new Set([
      ...chapterMeta.keys(),
      ...totalsMap.keys(),
    ]);

    for (const chapterId of allChapterIds) {
      const meta = chapterMeta.get(chapterId) || {
        chapterTitle: 'Chapter',
        sectionTitle: '',
      };
      const totals = totalsMap.get(chapterId);
      const totalQuestions = Number(totals?.totalQuestions) || 0;
      const uniqueLearners = Array.isArray(totals?.uniqueLearners)
        ? totals.uniqueLearners.length
        : 0;
      const intentCounts: Record<string, number> = {};
      for (const intent of totals?.intents || []) {
        const key = String(intent || 'question');
        intentCounts[key] = (intentCounts[key] || 0) + 1;
      }

      const topQuestions = (topByChapter.get(chapterId) || [])
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      chapters.push({
        chapterId,
        chapterTitle: meta.chapterTitle,
        sectionTitle: meta.sectionTitle,
        totalQuestions,
        uniqueLearners,
        topQuestions,
        intents: intentCounts,
        lastActivityAt: totals?.lastAt
          ? new Date(totals.lastAt).toISOString()
          : null,
        isConfusing: totalQuestions >= this.confusingThreshold,
      });
    }

    chapters.sort((a, b) => b.totalQuestions - a.totalQuestions);

    return { courseId: String(courseId), chapters };
  }

  async countAssistantTurnsForCommunity(communityId: string): Promise<number> {
    const courses = await this.coursModel
      .find({ communityId: String(communityId) })
      .select({ _id: 1 })
      .lean();
    const courseIds = courses.map((c) => String(c._id));
    if (courseIds.length === 0) return 0;

    const result = await this.conversationModel
      .aggregate([
        { $match: { courseId: { $in: courseIds } } },
        { $unwind: '$messages' },
        { $match: { 'messages.role': 'assistant' } },
        { $count: 'total' },
      ])
      .exec();

    return Number(result[0]?.total) || 0;
  }

  private async assertCourseCreator(
    courseId: string,
    userId: string,
  ): Promise<void> {
    const course = await this.coursModel.findById(courseId).select({ creatorId: 1 }).lean();
    if (!course) throw new NotFoundException('Course not found');
    const creatorId = String((course as any).creatorId || '');
    const requesterId = String(userId || '');
    if (!creatorId || creatorId !== requesterId) {
      throw new ForbiddenException('Only the course creator can view tutor insights');
    }
  }
}
