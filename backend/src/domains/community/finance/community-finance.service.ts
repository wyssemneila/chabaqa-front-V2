import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '@/infrastructure/database/schemas/commerce/order.schema';
import { User, UserDocument } from '@/infrastructure/database/schemas/auth/user.schema';

@Injectable()
export class CommunityFinanceService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getTransactions(
    communityId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      from?: string;
      to?: string;
    } = {},
  ) {
    const page = Math.max(1, Number(options.page || 1));
    const limit = Math.min(100, Math.max(1, Number(options.limit || 20)));
    const filter: Record<string, unknown> = {
      communityId: new Types.ObjectId(communityId),
    };

    if (options.status) filter.status = options.status;
    if (options.from || options.to) {
      filter.createdAt = {};
      if (options.from) (filter.createdAt as any).$gte = new Date(options.from);
      if (options.to) (filter.createdAt as any).$lte = new Date(options.to);
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.orderModel.countDocuments(filter),
    ]);

    const buyerIds = [...new Set(orders.map((o) => String(o.buyerId)))];
    const buyers = buyerIds.length
      ? await this.userModel
          .find({ _id: { $in: buyerIds.map((id) => new Types.ObjectId(id)) } })
          .select('name firstName lastName email username')
          .lean()
      : [];
    const buyerMap = new Map(buyers.map((b) => [String(b._id), b]));

    const items = orders.map((order) => {
      const buyer = buyerMap.get(String(order.buyerId));
      const buyerAny = buyer as any;
      const buyerName = buyer
        ? [buyerAny?.firstName, buyerAny?.lastName].filter(Boolean).join(' ').trim() || buyer.name || buyer.email
        : 'Unknown buyer';
      return {
        id: String(order._id),
        date: (order as any).createdAt,
        buyerId: String(order.buyerId),
        buyerName,
        buyerEmail: buyer?.email,
        contentType: order.contentType,
        contentId: order.contentId,
        amountDT: order.amountDT,
        creatorNetDT: order.creatorNetDT,
        platformFeeDT: order.platformFeeDT,
        status: order.status,
        paymentMethod: order.paymentMethod,
      };
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getTransactionStats(communityId: string) {
    const communityObjectId = new Types.ObjectId(communityId);
    const [totals] = await this.orderModel.aggregate([
      { $match: { communityId: communityObjectId, status: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amountDT' },
          totalCreatorNet: { $sum: '$creatorNetDT' },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    const statusCounts = await this.orderModel.aggregate([
      { $match: { communityId: communityObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    return {
      totalRevenue: totals?.totalRevenue ?? 0,
      totalCreatorNet: totals?.totalCreatorNet ?? 0,
      orderCount: totals?.orderCount ?? 0,
      byStatus: statusCounts.reduce((acc: Record<string, number>, row) => {
        acc[row._id || 'unknown'] = row.count;
        return acc;
      }, {}),
    };
  }
}
