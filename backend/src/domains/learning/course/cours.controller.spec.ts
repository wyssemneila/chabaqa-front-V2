import { CoursController } from '@/domains/learning/course/cours.controller';

describe('CoursController access enforcement', () => {
  const courseId = 'course-public-id';
  const request = { user: { _id: 'user-id' }, headers: {} } as any;
  let trackingService: any;
  let contentAccessService: any;
  let controller: CoursController;

  beforeEach(() => {
    trackingService = {
      trackCoursView: jest.fn().mockResolvedValue({}),
      trackCoursStart: jest.fn().mockResolvedValue({}),
      trackCoursComplete: jest.fn().mockResolvedValue({}),
      updateCoursWatchTime: jest.fn().mockResolvedValue({}),
      trackCoursLike: jest.fn().mockResolvedValue({}),
      trackCoursShare: jest.fn().mockResolvedValue({}),
      trackCoursDownload: jest.fn().mockResolvedValue({}),
      addCoursBookmark: jest.fn().mockResolvedValue({}),
      removeCoursBookmark: jest.fn().mockResolvedValue({}),
      addCoursRating: jest.fn().mockResolvedValue({}),
      getCoursProgress: jest.fn().mockResolvedValue({}),
    };
    contentAccessService = {
      assertCourseAccess: jest.fn().mockResolvedValue({}),
    };
    controller = new CoursController(
      {} as any,
      {} as any,
      trackingService,
      {} as any,
      {} as any,
      {} as any,
      contentAccessService,
    );
  });

  it.each([
    ['view tracking', () => controller.trackView(courseId, request)],
    ['start tracking', () => controller.trackStart(courseId, request)],
    ['completion tracking', () => controller.trackComplete(courseId, request)],
    ['watch time', () => controller.updateWatchTime(courseId, { additionalTime: 30 }, request)],
    ['like tracking', () => controller.trackLike(courseId, request)],
    ['share tracking', () => controller.trackShare(courseId, request)],
    ['download tracking', () => controller.trackDownload(courseId, request)],
    ['bookmark creation', () => controller.addBookmark(courseId, 'bookmark-id', request)],
    ['bookmark deletion', () => controller.removeBookmark(courseId, 'bookmark-id', request)],
    ['rating', () => controller.addRating(courseId, 5, request, 'Great course')],
    ['tracking progress', () => controller.getProgress(courseId, request)],
  ])('requires course access before %s', async (_name, invoke) => {
    await invoke();

    expect(contentAccessService.assertCourseAccess).toHaveBeenCalledWith('user-id', courseId);
  });

  it('does not mutate tracking when course access is denied', async () => {
    contentAccessService.assertCourseAccess.mockRejectedValueOnce(new Error('denied'));

    await expect(controller.trackDownload(courseId, request)).rejects.toThrow('denied');
    expect(trackingService.trackCoursDownload).not.toHaveBeenCalled();
  });
});
