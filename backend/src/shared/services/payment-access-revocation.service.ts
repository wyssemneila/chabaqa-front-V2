import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TrackableContentType } from '@/infrastructure/database/schemas/learning/content-tracking.schema';

/** Reverses the concrete access grant that payment fulfillment created. */
@Injectable()
export class PaymentAccessRevocationService {
  private readonly logger = new Logger(PaymentAccessRevocationService.name);

  constructor(
    @InjectModel('Cours') private readonly courseModel: Model<any>,
    @InjectModel('CourseEnrollment') private readonly enrollmentModel: Model<any>,
    @InjectModel('Community') private readonly communityModel: Model<any>,
    @InjectModel('User') private readonly userModel: Model<any>,
    @InjectModel('Challenge') private readonly challengeModel: Model<any>,
    @InjectModel('Event') private readonly eventModel: Model<any>,
    @InjectModel('Session') private readonly sessionModel: Model<any>,
    @InjectModel('Subscription') private readonly subscriptionModel: Model<any>,
    @InjectModel('CommunityMemberSubscription') private readonly communityMemberSubscriptionModel: Model<any>,
  ) {}

  async revokeForOrder(order: any, reason: string, session?: any): Promise<void> {
    const buyerId = new Types.ObjectId(String(order.buyerId));
    const contentId = String(order.contentId || order.metadata?.contentId || '');
    const options = session ? { session } : undefined;
    const setOptions = options ? { ...options, arrayFilters: [{ 'booking.userId': buyerId }] } : { arrayFilters: [{ 'booking.userId': buyerId }] };

    switch (order.contentType) {
      case TrackableContentType.COURSE: {
        const enrollment = await this.enrollmentModel.findOneAndUpdate(
          { userId: buyerId, courseId: this.objectIdOrString(contentId), isActive: true },
          { $set: { isActive: false, revokedAt: new Date(), revocationReason: reason } },
          { new: true, ...(options || {}) },
        );
        if (enrollment) {
          await this.courseModel.updateOne({ _id: enrollment.courseId }, { $pull: { inscriptions: enrollment._id } }, options).exec();
        }
        break;
      }
      case TrackableContentType.CHAPTER:
      case 'chapter':
        await this.enrollmentModel.updateMany(
          { userId: buyerId, purchasedChapterIds: contentId },
          { $pull: { purchasedChapterIds: contentId } },
          options,
        ).exec();
        break;
      case TrackableContentType.COMMUNITY: {
        const communityId = this.objectIdOrString(contentId);
        await this.communityModel.updateOne(
          { _id: communityId },
          { $pull: { members: buyerId, admins: buyerId, moderateurs: buyerId } },
          options,
        ).exec();
        await this.userModel.updateOne({ _id: buyerId }, { $pull: { joinedCommunities: communityId } }, options).exec();
        await this.communityMemberSubscriptionModel.updateMany(
          { sourceOrderId: order._id, status: { $ne: 'canceled' } },
          { $set: { status: 'canceled', cancelAtPeriodEnd: false, currentPeriodEnd: new Date(), revocationReason: reason } },
          options,
        ).exec();
        break;
      }
      case TrackableContentType.CHALLENGE:
        await this.challengeModel.updateOne(
          { _id: this.objectIdOrString(contentId) },
          { $pull: { participants: { userId: buyerId } } },
          options,
        ).exec();
        break;
      case TrackableContentType.EVENT:
        await this.eventModel.updateOne(
          { _id: this.objectIdOrString(contentId) },
          { $pull: { attendees: { userId: buyerId } } },
          options,
        ).exec();
        break;
      case TrackableContentType.SESSION:
        await this.sessionModel.updateOne(
          { _id: this.objectIdOrString(contentId), 'bookings.userId': buyerId },
          { $set: { 'bookings.$[booking].status': 'cancelled', 'bookings.$[booking].meetingUrl': undefined, 'bookings.$[booking].googleEventId': undefined, 'bookings.$[booking].meetStatus': 'revoked' } },
          setOptions,
        ).exec();
        break;
      case TrackableContentType.SUBSCRIPTION:
        await this.subscriptionModel.updateMany(
          { creatorId: buyerId, status: { $nin: ['canceled', 'expired'] } },
          { $set: { status: 'canceled', cancelAtPeriodEnd: false, currentPeriodEnd: new Date(), nextBillingAt: undefined } },
          options,
        ).exec();
        break;
      default:
        this.logger.warn(`No concrete refund revocation handler for ${String(order.contentType)}`);
    }
  }

  private objectIdOrString(value: string): any {
    return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : value;
  }
}
