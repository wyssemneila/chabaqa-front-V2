import { Types } from 'mongoose';

export function buildOrder(overrides: Record<string, any> = {}) {
  const id = overrides._id || new Types.ObjectId();

  return {
    _id: id,
    buyerId: overrides.buyerId || new Types.ObjectId(),
    creatorId: overrides.creatorId || new Types.ObjectId(),
    contentType: 'course',
    contentId: overrides.contentId || new Types.ObjectId(),
    amount: 100,
    currency: 'TND',
    status: 'pending',
    fulfillmentStatus: 'pending',
    createdAt: new Date(),
    ...overrides,
  };
}
