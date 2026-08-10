import { AiController } from '@/domains/shared/ai/ai.controller';

describe('AiController course access enforcement', () => {
  const courseId = 'course-public-id';
  const chapterId = 'chapter-id';
  const request = { user: { _id: 'user-id' } };
  let aiService: any;
  let contentAccessService: any;
  let controller: AiController;

  beforeEach(() => {
    aiService = {
      askChapterQuestion: jest.fn().mockResolvedValue({}),
      getChapterHistory: jest.fn().mockResolvedValue({}),
    };
    contentAccessService = {
      assertCourseAccess: jest.fn().mockResolvedValue({}),
    };
    controller = new AiController(aiService, {} as any, contentAccessService);
  });

  it.each([
    ['ask', () => controller.askQuestion(courseId, chapterId, { question: 'Explain this' } as any, request)],
    ['read history', () => controller.getChapterHistory(courseId, chapterId, request)],
  ])('requires course access before users can %s', async (_name, invoke) => {
    await invoke();

    expect(contentAccessService.assertCourseAccess).toHaveBeenCalledWith('user-id', courseId);
  });

  it('does not invoke the tutor when course access is denied', async () => {
    contentAccessService.assertCourseAccess.mockRejectedValueOnce(new Error('denied'));

    await expect(
      controller.askQuestion(courseId, chapterId, { question: 'Explain this' } as any, request),
    ).rejects.toThrow('denied');
    expect(aiService.askChapterQuestion).not.toHaveBeenCalled();
  });
});
