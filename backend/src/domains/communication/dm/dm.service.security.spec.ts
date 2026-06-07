import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { DmService } from '@/domains/communication/dm/dm.service';

describe('DmService BOLA regression', () => {
  const buildThenableConversationQuery = (conversation: any) => {
    const query: any = {
      populate: jest.fn(() => query),
      then: (resolve: (value: any) => void) => resolve(conversation),
    };
    return query;
  };

  const buildService = (conversation: any) => {
    const conversationModel = {
      findById: jest.fn(() => buildThenableConversationQuery(conversation)),
    };
    return new DmService(
      conversationModel as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  };

  it('blocks direct-message conversation reads by non-participants', async () => {
    const conversation = {
      _id: new Types.ObjectId(),
      type: 'DIRECT',
      participantA: new Types.ObjectId(),
      participantB: new Types.ObjectId(),
    };
    const attackerId = new Types.ObjectId().toString();
    const service = buildService(conversation);

    await expect(
      (service as any).getConversationForUser(String(conversation._id), attackerId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not hide missing conversations behind authorization errors', async () => {
    const service = buildService(null);

    await expect(
      (service as any).getConversationForUser(new Types.ObjectId().toString(), new Types.ObjectId().toString()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
