import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Entitlement, EntitlementDocument } from '@/infrastructure/database/schemas/commerce/entitlement.schema';

@Injectable()
export class EntitlementService {
  constructor(@InjectModel(Entitlement.name) private readonly entitlementModel: Model<EntitlementDocument>) {}

  async activateForOrder(order: any, session: any = null): Promise<void> {
    const orderId = new Types.ObjectId(String(order._id));
    const options: any = { upsert: true, new: true, setDefaultsOnInsert: true };
    if (session) options.session = session;
    await this.entitlementModel.findOneAndUpdate(
      { orderId },
      {
        $set: {
          userId: new Types.ObjectId(String(order.buyerId?._id || order.buyerId)),
          contentType: order.contentType,
          contentId: String(order.contentId),
          status: 'active',
          activatedAt: new Date(),
          revokedAt: null,
          revocationReason: null,
        },
        $setOnInsert: { orderId },
      },
      options,
    ).exec();
  }

  async revokeForOrder(orderId: string, reason: string, session: any = null): Promise<void> {
    if (!Types.ObjectId.isValid(orderId)) return;
    const options: any = session ? { session } : {};
    await this.entitlementModel.updateOne(
      { orderId: new Types.ObjectId(orderId), status: { $ne: 'revoked' } },
      { $set: { status: 'revoked', revokedAt: new Date(), revocationReason: reason.slice(0, 300) } },
      options,
    ).exec();
  }
}
