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
        // Match the attendee in the mutation filter so duplicate refund webhooks
        // cannot free inventory more than once.
        const eventId = this.objectIdOrString(contentId);
        const event: any = await this.eventModel.findOne(
          { _id: eventId, 'attendees.userId': buyerId },
          { attendees: { $elemMatch: { userId: buyerId } } },
          options,
        ).lean();
        const attendee = event?.attendees?.[0];
        if (!attendee) break;
        await this.eventModel.updateOne(
          { _id: eventId, 'attendees.userId': buyerId },
          {
            $pull: { attendees: { userId: buyerId } },
            $inc: { 'tickets.$[ticket].sold': -1 },
          },
          {
            ...(options || {}),
            arrayFilters: [{ 'ticket.type': attendee.ticketType, 'ticket.sold': { $gt: 0 } }],
          },
        ).exec();
        break;
      case TrackableContentType.SESSION:
        {
          const sourceOrderId = String(order._id || '');
          const sessionDoc = await this.sessionModel.findOne(
            { _id: this.objectIdOrString(contentId), 'bookings.sourceOrderId': sourceOrderId },
            undefined,
            options,
          );
          if (!sessionDoc) break;
          const booking = (sessionDoc.bookings || []).find((item: any) => String(item.sourceOrderId || '') === sourceOrderId);
          if (!booking) break;
          booking.status = 'cancelled';
          booking.meetingUrl = undefined;
          booking.googleEventId = undefined;
          booking.meetStatus = 'not_required';
          booking.meetFailureReason = undefined;
          booking.updatedAt = new Date();
          if (booking.slotId) {
            const slot = (sessionDoc.availableSlots || []).find((item: any) => item.id === booking.slotId);
            if (slot && String(slot.bookedBy || '') === String(booking.userId || '')) {
              slot.isAvailable = true;
              slot.bookedBy = undefined;
              slot.bookedAt = undefined;
            }
          }
          sessionDoc.markModified('bookings');
          sessionDoc.markModified('availableSlots');
          await sessionDoc.save(options);
        }
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
