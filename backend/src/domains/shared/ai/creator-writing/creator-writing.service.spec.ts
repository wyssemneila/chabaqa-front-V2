import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreatorWritingService } from './creator-writing.service';

describe('CreatorWritingService', () => {
  const creatorId = new Types.ObjectId();
  const communityId = new Types.ObjectId();
  const communityModel = { findById: jest.fn() };
  const subscriptionModel = { findOne: jest.fn() };
  const planModel = { findOne: jest.fn() };
  const counterModel = { findOne: jest.fn(), findOneAndUpdate: jest.fn() };
  const config = { get: jest.fn((key:string) => ({ AI_PROVIDER:'OPENROUTER', OPENROUTER_API_KEY:'test', AI_MODEL:'test-model' } as any)[key]) };
  const service = new CreatorWritingService(config as any, communityModel as any, subscriptionModel as any, planModel as any, counterModel as any);

  beforeEach(() => jest.clearAllMocks());

  it('reports the plan monthly quota', async () => {
    subscriptionModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ plan:'growth' }) });
    planModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ limits:{ creatorFieldGenerationsPerMonth:150 } }) });
    counterModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ used:42 }) });
    const result = await service.usage(creatorId.toString());
    expect(result).toMatchObject({ plan:'growth', used:42, limit:150, remaining:108, percentage:28 });
  });

  it('rejects a creator who does not own the community', async () => {
    communityModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id:communityId, createur:new Types.ObjectId(), name:'Test' }) });
    await expect(service.generate(communityId.toString(), creatorId.toString(), {} as any)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('accepts plain text provider output when JSON mode is ignored', async () => {
    communityModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id:communityId, createur:creatorId, name:'Test' }) });
    subscriptionModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ plan:'starter' }) });
    planModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ limits:{ creatorFieldGenerationsPerMonth:25 } }) });
    counterModel.findOneAndUpdate.mockResolvedValue({ used:1 });
    counterModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ used:1 }) });
    ;(service as any).client.chat.completions.create = jest.fn().mockResolvedValue({ choices:[{ message:{ content:'A polished title' } }] });
    const result = await service.generate(communityId.toString(), creatorId.toString(), { contentType:'course', field:'title', action:'generate', context:'test' } as any);
    expect(result.content).toBe('A polished title');
  });
});
