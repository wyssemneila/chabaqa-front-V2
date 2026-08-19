import { CourseEnrollmentController } from '@/domains/learning/course-enrollment/course-enrollment.controller';

describe('CourseEnrollmentController access enforcement', () => {
  const courseId = 'course-public-id';
  const request = { user: { _id: 'user-id' } } as any;
  let enrollmentService: any;
  let contentAccessService: any;
  let controller: CourseEnrollmentController;

  beforeEach(() => {
    enrollmentService = {
      startChapter: jest.fn().mockResolvedValue({}),
      getUserCourseProgress: jest.fn().mockResolvedValue({}),
      completeChapter: jest.fn().mockResolvedValue({}),
      updateWatchTime: jest.fn().mockResolvedValue({}),
      completeSection: jest.fn().mockResolvedValue({}),
      getSectionProgress: jest.fn().mockResolvedValue({}),
      completeCourse: jest.fn().mockResolvedValue({}),
    };
    contentAccessService = {
      assertCourseAccess: jest.fn().mockResolvedValue({}),
    };
    controller = new CourseEnrollmentController(enrollmentService, contentAccessService);
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['start a chapter', () => controller.startChapter(request, courseId, 'section-id', 'chapter-id', {})],
    ['read course progress', () => controller.getUserCourseProgress(request, courseId)],
    ['complete a chapter', () => controller.completeChapter(request, courseId, 'chapter-id')],
    ['update chapter watch time', () => controller.updateWatchTime(request, courseId, 'chapter-id', { watchTime: 30 })],
    ['complete a section', () => controller.completeSection(request, courseId, 'section-id', {})],
    ['read section progress', () => controller.getSectionProgress(request, courseId, 'section-id')],
    ['complete a course', () => controller.completeCourse(request, courseId)],
  ])('requires course access before it can %s', async (_name, invoke) => {
    await invoke();

    expect(contentAccessService.assertCourseAccess).toHaveBeenCalledWith('user-id', courseId);
  });

  it('does not complete a chapter when course access is denied', async () => {
    contentAccessService.assertCourseAccess.mockRejectedValueOnce(new Error('denied'));

    await expect(controller.completeChapter(request, courseId, 'chapter-id')).rejects.toThrow('denied');
    expect(enrollmentService.completeChapter).not.toHaveBeenCalled();
  });
});
