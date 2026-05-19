import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Community,
  CommunityDocument,
} from '@/infrastructure/database/schemas/community/community.schema';
import {
  AiAgent,
  AiAgentDocument,
} from '@/infrastructure/database/schemas/ai/ai-agent.schema';
import { CreateAiAgentDto, UpdateAiAgentDto } from './dto/ai-agent.dto';

@Injectable()
export class AiAgentService {
  constructor(
    @InjectModel(AiAgent.name)
    private readonly aiAgentModel: Model<AiAgentDocument>,
    @InjectModel(Community.name)
    private readonly communityModel: Model<CommunityDocument>,
  ) {}

  async list(communityId: string, userId: string) {
    await this.assertCanManageCommunity(communityId, userId);
    return this.aiAgentModel
      .find({ communityId, status: { $ne: 'deleted' } })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async create(communityId: string, userId: string, dto: CreateAiAgentDto) {
    const community = await this.assertCanManageCommunity(communityId, userId);
    return this.aiAgentModel.create({
      ...dto,
      communityId: community._id,
      creatorId: new Types.ObjectId(userId),
      languages: dto.languages?.length ? dto.languages : ['en'],
    });
  }

  async update(
    communityId: string,
    agentId: string,
    userId: string,
    dto: UpdateAiAgentDto,
  ) {
    await this.assertCanManageCommunity(communityId, userId);
    const agent = await this.aiAgentModel
      .findOneAndUpdate(
        { _id: agentId, communityId },
        { $set: dto },
        { new: true },
      )
      .exec();
    if (!agent) throw new NotFoundException('AI agent not found');
    return agent;
  }

  async remove(communityId: string, agentId: string, userId: string) {
    await this.assertCanManageCommunity(communityId, userId);
    const agent = await this.aiAgentModel
      .findOneAndUpdate(
        { _id: agentId, communityId },
        { $set: { status: 'paused' } },
        { new: true },
      )
      .exec();
    if (!agent) throw new NotFoundException('AI agent not found');
    return { success: true };
  }

  async assertCanManageCommunity(communityId: string, userId: string) {
    const community = await this.communityModel.findById(communityId).exec();
    if (!community) throw new NotFoundException('Community not found');
    if (
      !community.isAdmin(new Types.ObjectId(userId)) &&
      String(community.createur) !== String(userId)
    ) {
      throw new ForbiddenException('Only community staff can manage AI agents');
    }
    return community;
  }
}
