import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TrackableContentType } from '@/infrastructure/database/schemas/learning/content-tracking.schema';

/** Single server-side access decision point for paid/member content. */
@Injectable()
export class ContentAccessService {
  constructor(
    @InjectModel('Community') private readonly communityModel: Model<any>,
    @InjectModel('Cours') private readonly courseModel: Model<any>,
    @InjectModel('CourseEnrollment') private readonly enrollmentModel: Model<any>,
    @InjectModel('Challenge') private readonly challengeModel: Model<any>,
    @InjectModel('Resource') private readonly resourceModel: Model<any>,
    @InjectModel('Entitlement') private readonly entitlementModel: Model<any>,
  ) {}

  private id(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) throw new NotFoundException('Content not found');
    return new Types.ObjectId(value);
  }

  async assertCommunityMember(userId: string, communityId: string): Promise<any> {
    const community: any = await this.communityModel.findById(this.id(communityId)).select('members createur').lean();
    if (!community) throw new NotFoundException('Community not found');
    const uid = String(userId);
    if (String(community.createur) === uid || (community.members || []).some((member: any) => String(member) === uid)) return community;
    throw new ForbiddenException('Active community membership is required');
  }

  async assertCourseAccess(userId: string, courseId: string): Promise<any> {
    const course: any = await this.courseModel.findById(this.id(courseId)).select('communityId creatorId createur').lean();
    if (!course) throw new NotFoundException('Course not found');
    const ownerId = String(course.creatorId || course.createur || '');
    if (ownerId === String(userId)) return course;
    await this.assertCommunityMember(userId, String(course.communityId));
    const enrollment = await this.enrollmentModel.exists({ userId: this.id(userId), courseId: course._id, isActive: true });
    if (!enrollment) throw new ForbiddenException('An active course enrollment is required');
    return course;
  }

  async assertChallengeAccess(userId: string, challengeId: string): Promise<any> {
    const challenge: any = await this.challengeModel.findById(this.id(challengeId)).select('communityId creatorId participants').lean();
    if (!challenge) throw new NotFoundException('Challenge not found');
    if (String(challenge.creatorId) === String(userId)) return challenge;
    await this.assertCommunityMember(userId, String(challenge.communityId));
    if (!(challenge.participants || []).some((participant: any) => String(participant.userId) === String(userId) && participant.isActive !== false)) {
      throw new ForbiddenException('An active challenge participation is required');
    }
    return challenge;
  }

  async assertResourceAccess(userId: string, resourceId: string): Promise<any> {
    const resource: any = await this.resourceModel.findById(this.id(resourceId)).lean();
    if (!resource || !resource.isPublished) throw new NotFoundException('Resource not found');
    if (resource.communityId) await this.assertCommunityMember(userId, String(resource.communityId));
    if (resource.isPremium) {
      const entitlement = await this.entitlementModel.exists({ userId: this.id(userId), contentType: TrackableContentType.RESOURCE, contentId: String(resource._id), status: 'active' });
      if (!entitlement) throw new ForbiddenException('An active resource entitlement is required');
    }
    return resource;
  }
}
