import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Community,
  CommunityDocument,
} from '@/infrastructure/database/schemas/community/community.schema';
import { UpdateAiSettingsDto } from './dto/update-ai-settings.dto';

@Injectable()
export class AiSettingsService {
  constructor(
    @InjectModel(Community.name)
    private communityModel: Model<CommunityDocument>,
  ) {}

  async getSettings(communityId: string) {
    const community = await this.communityModel
      .findById(communityId)
      .select('aiSettings')
      .exec();
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    return {
      success: true,
      data: community.aiSettings || {
        courseTutorEnabled: true,
        supportAgentEnabled: false,
        learningPathsEnabled: true,
        providerOverride: 'openrouter',
        agentsEnabled: true,
        cofounderEnabled: true,
      },
    };
  }

  async updateSettings(
    communityId: string,
    updateDto: UpdateAiSettingsDto,
    userId: string,
  ) {
    const community = await this.communityModel.findById(communityId).exec();
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    if (
      !community.isAdmin(new Types.ObjectId(userId)) &&
      String(community.createur) !== String(userId)
    ) {
      throw new UnauthorizedException('Only admins can update AI settings');
    }

    const { defaultConciergeAgentId, ...settingsUpdate } = updateDto;

    community.aiSettings = {
      ...community.aiSettings,
      ...settingsUpdate,
      ...(defaultConciergeAgentId
        ? {
            defaultConciergeAgentId: new Types.ObjectId(
              defaultConciergeAgentId,
            ),
          }
        : {}),
    };

    await community.save();

    return {
      success: true,
      data: community.aiSettings,
    };
  }
}
