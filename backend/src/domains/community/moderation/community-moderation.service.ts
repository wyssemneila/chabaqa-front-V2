import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from '@/infrastructure/database/schemas/content/post.schema';
import { User, UserDocument } from '@/infrastructure/database/schemas/auth/user.schema';

const QUEUE_STATUSES = ['pending', 'flagged', 'escalated'];

@Injectable()
export class CommunityModerationService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getQueue(
    communityId: string,
    options: { page?: number; limit?: number; status?: string } = {},
  ) {
    const page = Math.max(1, Number(options.page || 1));
    const limit = Math.min(100, Math.max(1, Number(options.limit || 20)));
    const statusFilter = options.status ? [options.status] : QUEUE_STATUSES;
    const filter = {
      communityId: new Types.ObjectId(communityId),
      moderationStatus: { $in: statusFilter },
    };

    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.postModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      this.postModel.countDocuments(filter),
    ]);

    const items = posts.map((post) => {
      const postAny = post as any;
      return {
      id: String(post._id),
      contentType: 'post' as const,
      contentId: String(post._id),
      communityId,
      status: postAny.moderationStatus || 'pending',
      reportCount: 0,
      content: post,
      createdAt: postAny.createdAt,
      updatedAt: postAny.updatedAt,
    };
    });

    const stats = await this.getStatsCounts(communityId);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      stats,
    };
  }

  private async getStatsCounts(communityId: string) {
    const communityObjectId = new Types.ObjectId(communityId);
    const rows = await this.postModel.aggregate([
      { $match: { communityId: communityObjectId } },
      { $group: { _id: '$moderationStatus', count: { $sum: 1 } } },
    ]);
    const map = rows.reduce((acc: Record<string, number>, row) => {
      acc[row._id || 'approved'] = row.count;
      return acc;
    }, {} as Record<string, number>);
    return {
      pending: map.pending ?? 0,
      approved: map.approved ?? 0,
      hidden: map.hidden ?? map.rejected ?? 0,
      deleted: map.deleted ?? 0,
      flagged: map.flagged ?? 0,
      escalated: map.escalated ?? 0,
    };
  }

  async getStats(communityId: string) {
    const counts = await this.getStatsCounts(communityId);
    return {
      totalPending: counts.pending + counts.flagged + counts.escalated,
      totalReviewed: counts.approved + counts.hidden,
      avgResponseTime: 0,
      escalations: counts.escalated,
      pinnedPosts: await this.postModel.countDocuments({
        communityId: new Types.ObjectId(communityId),
        isPinned: true,
      }),
      byStatus: counts,
    };
  }

  async getActivity(communityId: string, limit = 20) {
    const posts = await this.postModel
      .find({
        communityId: new Types.ObjectId(communityId),
        moderationStatus: { $in: ['hidden', 'rejected', 'flagged', 'approved', 'escalated'] },
      })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    return posts.map((post) => {
      const postAny = post as any;
      return {
      id: `activity-${post._id}`,
      moderatorId: String(post.authorId),
      action:
        postAny.moderationStatus === 'hidden' || postAny.moderationStatus === 'rejected'
          ? 'hide'
          : postAny.moderationStatus === 'approved'
            ? 'approve'
            : 'restore',
      contentType: 'post' as const,
      contentId: String(post._id),
      timestamp: postAny.updatedAt,
    };
    });
  }

  async getFlaggedUsers(communityId: string) {
    const rows = await this.postModel.aggregate([
      {
        $match: {
          communityId: new Types.ObjectId(communityId),
          moderationStatus: { $in: ['flagged', 'escalated', 'pending'] },
        },
      },
      { $group: { _id: '$authorId', flaggedPosts: { $sum: 1 } } },
      { $sort: { flaggedPosts: -1 } },
      { $limit: 50 },
    ]);

    const userIds = rows.map((r) => r._id);
    const users = userIds.length
      ? await this.userModel.find({ _id: { $in: userIds } }).select('name firstName lastName email username').lean()
      : [];
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    return rows.map((row) => {
      const user = userMap.get(String(row._id));
      const userAny = user as any;
      const name = user
        ? [userAny?.firstName, userAny?.lastName].filter(Boolean).join(' ').trim() || user.name || user.email
        : 'Unknown user';
      return {
        userId: String(row._id),
        name,
        email: user?.email,
        flaggedPosts: row.flaggedPosts,
      };
    });
  }
}
