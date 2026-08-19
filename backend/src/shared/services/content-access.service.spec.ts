import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ContentAccessService } from '@/shared/services/content-access.service';

const query = (value: any) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
});

describe('ContentAccessService course access', () => {
  const userId = new Types.ObjectId().toString();
  const courseId = 'course-public-id';
  const course = {
    _id: new Types.ObjectId(),
    communityId: new Types.ObjectId(),
    creatorId: new Types.ObjectId(),
  };
  let courseModel: any;
  let enrollmentModel: any;
  let service: ContentAccessService;

  beforeEach(() => {
    courseModel = {
      findById: jest.fn(),
      findOne: jest.fn().mockReturnValue(query(course)),
    };
    enrollmentModel = { exists: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }) };
    service = new ContentAccessService(
      {
        findById: jest.fn().mockReturnValue(query({ members: [userId] })),
      } as any,
      courseModel,
      enrollmentModel,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('resolves a custom course id before checking active enrollment', async () => {
    await expect(service.assertCourseAccess(userId, courseId)).resolves.toEqual(course);

    expect(courseModel.findById).not.toHaveBeenCalled();
    expect(courseModel.findOne).toHaveBeenCalledWith({ id: courseId });
    expect(enrollmentModel.exists).toHaveBeenCalledWith({
      userId: new Types.ObjectId(userId),
      courseId: course._id,
      isActive: true,
    });
  });

  it('rejects a community member without active enrollment', async () => {
    enrollmentModel.exists.mockResolvedValueOnce(null);

    await expect(service.assertCourseAccess(userId, courseId)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
