import { Types } from 'mongoose';
import { SubscriptionScheduler } from '@/domains/commerce/subscription/subscription.scheduler';
import { SubscriptionStatus } from '@/infrastructure/database/schemas/commerce/subscription.schema';
import { CommunityMemberSubscriptionStatus } from '@/infrastructure/database/schemas/commerce/community-member-subscription.schema';
import { PlanTier } from '@/infrastructure/database/schemas/commerce/plan.schema';

const objectId = () => new Types.ObjectId();

const chain = (value: any) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(value),
});

describe('SubscriptionScheduler lifecycle hardening', () => {
  const originalPlanEnforcementMode = process.env.PLAN_ENFORCEMENT_MODE;

  const buildScheduler = (overrides: Record<string, any> = {}) => {
    const models = {
      subModel: { updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }) },
      memberSubscriptionModel: {
        find: jest.fn().mockReturnValue(chain([])),
        updateOne: jest.fn().mockReturnValue(chain({ modifiedCount: 0 })),
        exists: jest.fn().mockResolvedValue(null),
      },
      communityModel: { updateOne: jest.fn().mockReturnValue(chain({ modifiedCount: 0 })) },
      userModel: { updateOne: jest.fn().mockReturnValue(chain({ modifiedCount: 0 })) },
      planModel: { findOne: jest.fn().mockReturnValue(chain(null)) },
      ...overrides,
    };

    return {
      scheduler: new SubscriptionScheduler(
        models.subModel as any,
        models.memberSubscriptionModel as any,
        models.communityModel as any,
        models.userModel as any,
        models.planModel as any,
      ),
      models,
    };
  };

  beforeEach(() => {
    process.env.PLAN_ENFORCEMENT_MODE = 'true';
  });

  afterAll(() => {
    if (originalPlanEnforcementMode === undefined) {
      delete process.env.PLAN_ENFORCEMENT_MODE;
    } else {
      process.env.PLAN_ENFORCEMENT_MODE = originalPlanEnforcementMode;
    }
  });

  it('revokes a community membership after its recurring period ends', async () => {
    const communityId = objectId();
    const subscriberId = objectId();
    const expiredSubscription = {
      _id: objectId(),
      communityId,
      subscriberId,
      status: CommunityMemberSubscriptionStatus.ACTIVE,
      currentPeriodEnd: new Date(Date.now() - 60 * 60 * 1000),
    };
    const { scheduler, models } = buildScheduler({
      memberSubscriptionModel: {
        find: jest.fn().mockReturnValue(chain([expiredSubscription])),
        updateOne: jest.fn().mockReturnValue(chain({ modifiedCount: 1 })),
        exists: jest.fn().mockResolvedValue(null),
      },
      communityModel: { updateOne: jest.fn().mockReturnValue(chain({ modifiedCount: 1 })) },
      userModel: { updateOne: jest.fn().mockReturnValue(chain({ modifiedCount: 1 })) },
    });

    await scheduler.revokeExpiredCommunityMemberships();

    expect(models.memberSubscriptionModel.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: expiredSubscription._id,
        currentPeriodEnd: expect.objectContaining({ $lte: expect.any(Date) }),
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          status: CommunityMemberSubscriptionStatus.CANCELED,
          cancelAtPeriodEnd: false,
        }),
      }),
    );
    expect(models.communityModel.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: communityId, members: subscriberId }),
      expect.arrayContaining([
        expect.objectContaining({ $set: expect.objectContaining({ members: expect.any(Object) }) }),
      ]),
    );
    expect(models.userModel.updateOne).toHaveBeenCalledWith(
      { _id: subscriberId },
      { $pull: { joinedCommunities: communityId } },
    );
  });

  it('does not revoke a member with a replacement recurring subscription', async () => {
    const subscription = {
      _id: objectId(),
      communityId: objectId(),
      subscriberId: objectId(),
      status: CommunityMemberSubscriptionStatus.ACTIVE,
      currentPeriodEnd: new Date(Date.now() - 60 * 60 * 1000),
    };
    const { scheduler, models } = buildScheduler({
      memberSubscriptionModel: {
        find: jest.fn().mockReturnValue(chain([subscription])),
        updateOne: jest.fn().mockReturnValue(chain({ modifiedCount: 1 })),
        exists: jest.fn().mockResolvedValue({ _id: objectId() }),
      },
    });

    await scheduler.revokeExpiredCommunityMemberships();

    expect(models.communityModel.updateOne).not.toHaveBeenCalled();
    expect(models.userModel.updateOne).not.toHaveBeenCalled();
  });

  it('downgrades canceled creator subscriptions to Starter after their period ends', async () => {
    const starterLimits = {
      communitiesMax: 1,
      membersMax: 100,
      coursesActivationMax: 3,
      storageGB: 5,
      adminsMax: 1,
      emailCampaignRecipientsPerMonth: 0,
      whatsappMessagesPerMonth: 0,
      analyticsLookbackDays: 30,
      sessionBookingsPerMonth: 0,
      creatorFieldGenerationsPerMonth: 25,
    };
    const { scheduler, models } = buildScheduler({
      planModel: { findOne: jest.fn().mockReturnValue(chain({ limits: starterLimits })) },
      subModel: { updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }) },
    });

    await scheduler.downgradeCanceledCreatorSubscriptions();

    expect(models.subModel.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPeriodEnd: expect.objectContaining({ $lte: expect.any(Date) }),
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          status: SubscriptionStatus.CANCELED,
          cancelAtPeriodEnd: false,
          plan: PlanTier.STARTER,
          amount: 0,
          membersMax: starterLimits.membersMax,
        }),
        $unset: { nextBillingAt: 1 },
      }),
    );
  });

  it('does not mark scheduled creator cancellations past due before they are downgraded', async () => {
    const { scheduler, models } = buildScheduler();

    await scheduler.expireSubscriptions();

    expect(models.subModel.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ cancelAtPeriodEnd: { $ne: true } }),
      { $set: { status: SubscriptionStatus.PAST_DUE } },
    );
  });
});
