import { Types } from 'mongoose';
import { EntitlementService } from './entitlement.service';

describe('EntitlementService', () => {
  const exec = jest.fn();
  const model = {
    findOneAndUpdate: jest.fn(() => ({ exec })),
    updateOne: jest.fn(() => ({ exec })),
  };
  const service = new EntitlementService(model as any);

  beforeEach(() => jest.clearAllMocks());

  it('activates one entitlement for a completed order', async () => {
    const orderId = new Types.ObjectId();
    const buyerId = new Types.ObjectId();
    await service.activateForOrder({ _id: orderId, buyerId, contentType: 'course', contentId: 'course-1' });

    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { orderId },
      expect.objectContaining({
        $set: expect.objectContaining({ userId: buyerId, contentType: 'course', contentId: 'course-1', status: 'active' }),
      }),
      expect.objectContaining({ upsert: true, new: true }),
    );
  });

  it('revokes the entitlement after refund', async () => {
    const orderId = new Types.ObjectId();
    await service.revokeForOrder(orderId.toString(), 'customer_refund');

    expect(model.updateOne).toHaveBeenCalledWith(
      { orderId, status: { $ne: 'revoked' } },
      { $set: expect.objectContaining({ status: 'revoked', revocationReason: 'customer_refund' }) },
      {},
    );
  });
});
