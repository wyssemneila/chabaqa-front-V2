import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionStatus,
} from '@/infrastructure/database/schemas/commerce/subscription.schema';
import {
  CommunityMemberSubscription,
  CommunityMemberSubscriptionDocument,
  CommunityMemberSubscriptionStatus,
} from '@/infrastructure/database/schemas/commerce/community-member-subscription.schema';
import { Community, CommunityDocument } from '@/infrastructure/database/schemas/community/community.schema';
import { User, UserDocument } from '@/infrastructure/database/schemas/auth/user.schema';
import { Plan, PlanDocument, PlanTier } from '@/infrastructure/database/schemas/commerce/plan.schema';
import { getDefaultCreatorPlanDoc } from '@/domains/commerce/subscription/default-creator-plans';

/**
 * Periodically checks for expired subscriptions / trials and marks them
 * as PAST_DUE so that PolicyService begins restricting access.
 *
 * Only runs when PLAN_ENFORCEMENT_MODE=true.
 */
@Injectable()
export class SubscriptionScheduler {
  private readonly logger = new Logger(SubscriptionScheduler.name);

  constructor(
    @InjectModel(Subscription.name)
    private readonly subModel: Model<SubscriptionDocument>,
    @InjectModel(CommunityMemberSubscription.name)
    private readonly memberSubscriptionModel: Model<CommunityMemberSubscriptionDocument>,
    @InjectModel(Community.name)
    private readonly communityModel: Model<CommunityDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Plan.name)
    private readonly planModel: Model<PlanDocument>,
  ) {}

  /** Every hour: move active subscriptions past their billing end → PAST_DUE */
  @Cron(CronExpression.EVERY_HOUR)
  async expireSubscriptions(): Promise<void> {
    if (process.env.PLAN_ENFORCEMENT_MODE !== 'true') return;

    const now = new Date();
    const result = await this.subModel.updateMany(
      {
        status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
        cancelAtPeriodEnd: { $ne: true },
        currentPeriodEnd: { $lt: now },
      },
      { $set: { status: SubscriptionStatus.PAST_DUE } },
    );

    if (result.modifiedCount > 0) {
      this.logger.warn(
        `Expired ${result.modifiedCount} subscription(s) whose currentPeriodEnd < now`,
      );
    }
  }

  /** Every hour: revoke recurring community access only after its paid period ends. */
  @Cron(CronExpression.EVERY_HOUR)
  async revokeExpiredCommunityMemberships(): Promise<void> {
    if (process.env.PLAN_ENFORCEMENT_MODE !== 'true') return;

    const now = new Date();
    const expiredSubscriptions = await this.memberSubscriptionModel.find({
      status: {
        $in: [
          CommunityMemberSubscriptionStatus.ACTIVE,
          CommunityMemberSubscriptionStatus.TRIALING,
          CommunityMemberSubscriptionStatus.PAST_DUE,
        ],
      },
      currentPeriodEnd: { $lte: now },
    }).select('communityId subscriberId currentPeriodEnd status').lean().exec();
    let revoked = 0;

    for (const subscription of expiredSubscriptions) {
      // Claim the expiration first. A successful renewal that extends the period
      // before this write wins and leaves the membership untouched.
      const cancellation = await this.memberSubscriptionModel.updateOne(
        {
          _id: subscription._id,
          status: {
            $in: [
              CommunityMemberSubscriptionStatus.ACTIVE,
              CommunityMemberSubscriptionStatus.TRIALING,
              CommunityMemberSubscriptionStatus.PAST_DUE,
            ],
          },
          currentPeriodEnd: { $lte: now },
        },
        {
          $set: {
            status: CommunityMemberSubscriptionStatus.CANCELED,
            cancelAtPeriodEnd: false,
          },
          $unset: { nextBillingAt: 1 },
        },
      ).exec();
      if (cancellation.modifiedCount === 0) continue;

      // Do not revoke a member that has another live recurring entitlement for
      // the same community, including one created by a replacement checkout.
      const replacement = await this.memberSubscriptionModel.exists({
        communityId: subscription.communityId,
        subscriberId: subscription.subscriberId,
        status: {
          $in: [
            CommunityMemberSubscriptionStatus.ACTIVE,
            CommunityMemberSubscriptionStatus.TRIALING,
          ],
        },
        currentPeriodEnd: { $gt: now },
      });
      if (replacement) continue;

      const communityUpdate = await this.communityModel.updateOne(
        {
          _id: subscription.communityId,
          createur: { $ne: subscription.subscriberId },
          members: subscription.subscriberId,
        },
        [
          {
            $set: {
              members: {
                $filter: {
                  input: { $ifNull: ['$members', []] },
                  as: 'member',
                  cond: { $ne: ['$$member', subscription.subscriberId] },
                },
              },
            },
          },
          { $set: { membersCount: { $size: '$members' } } },
        ] as any,
      ).exec();
      if (communityUpdate.modifiedCount === 0) continue;

      await this.userModel.updateOne(
        { _id: subscription.subscriberId },
        { $pull: { joinedCommunities: subscription.communityId } },
      ).exec();
      revoked += 1;
    }

    if (revoked > 0) {
      this.logger.log(`Revoked ${revoked} expired recurring community membership(s)`);
    }
  }

  /** Every hour: apply the Starter limits once a scheduled creator cancellation ends. */
  @Cron(CronExpression.EVERY_HOUR)
  async downgradeCanceledCreatorSubscriptions(): Promise<void> {
    if (process.env.PLAN_ENFORCEMENT_MODE !== 'true') return;

    const now = new Date();
    const fallbackStarterPlan = getDefaultCreatorPlanDoc(PlanTier.STARTER)!;
    const starterPlan = await this.planModel.findOne({
      tier: PlanTier.STARTER,
      isActive: true,
    }).lean().exec();
    const limits = starterPlan?.limits || fallbackStarterPlan.limits;

    const result = await this.subModel.updateMany(
      {
        status: {
          $in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.TRIALING,
            SubscriptionStatus.PAST_DUE,
            SubscriptionStatus.CANCELED,
          ],
        },
        currentPeriodEnd: { $lte: now },
        $or: [
          { cancelAtPeriodEnd: true },
          {
            status: SubscriptionStatus.CANCELED,
            $or: [
              { plan: { $ne: PlanTier.STARTER } },
              { amount: { $ne: 0 } },
              { nextBillingAt: { $exists: true } },
            ],
          },
        ],
      },
      {
        $set: {
          status: SubscriptionStatus.CANCELED,
          cancelAtPeriodEnd: false,
          plan: PlanTier.STARTER,
          amount: 0,
          communitiesMax: limits.communitiesMax,
          membersMax: limits.membersMax,
          coursesActivationMax: limits.coursesActivationMax,
          storageGB: limits.storageGB,
          adminsMax: limits.adminsMax,
          emailCampaignRecipientsPerMonth: limits.emailCampaignRecipientsPerMonth,
          whatsappMessagesPerMonth: limits.whatsappMessagesPerMonth,
          analyticsLookbackDays: limits.analyticsLookbackDays,
          sessionBookingsPerMonth: limits.sessionBookingsPerMonth,
          creatorFieldGenerationsPerMonth: limits.creatorFieldGenerationsPerMonth,
        },
        $unset: { nextBillingAt: 1 },
      },
    );

    if (result.modifiedCount > 0) {
      this.logger.log(`Downgraded ${result.modifiedCount} creator subscription(s) after cancellation`);
    }
  }

  /** Every hour: expire free trials that have no payment method attached */
  @Cron(CronExpression.EVERY_HOUR)
  async expireTrials(): Promise<void> {
    if (process.env.PLAN_ENFORCEMENT_MODE !== 'true') return;

    const now = new Date();
    const result = await this.subModel.updateMany(
      {
        status: SubscriptionStatus.TRIALING,
        trialEndsAt: { $lt: now },
        hasPaymentMethod: false,
      },
      { $set: { status: SubscriptionStatus.PAST_DUE } },
    );

    if (result.modifiedCount > 0) {
      this.logger.warn(
        `Expired ${result.modifiedCount} trial subscription(s) without payment method`,
      );
    }
  }

  /** Daily at 03:00: archive subscriptions canceled > 90 days ago */
  @Cron('0 3 * * *')
  async archiveCanceled(): Promise<void> {
    if (process.env.PLAN_ENFORCEMENT_MODE !== 'true') return;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await this.subModel.updateMany(
      {
        status: SubscriptionStatus.CANCELED,
        updatedAt: { $lt: ninetyDaysAgo },
        archived: { $ne: true },
      },
      { $set: { archived: true } },
    );

    if (result.modifiedCount > 0) {
      this.logger.log(
        `Archived ${result.modifiedCount} subscription(s) canceled > 90 days ago`,
      );
    }
  }
}
