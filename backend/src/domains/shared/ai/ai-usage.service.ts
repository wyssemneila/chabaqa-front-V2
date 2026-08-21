import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Community,
  CommunityDocument,
} from '@/infrastructure/database/schemas/community/community.schema';
import { AiTutorAnalyticsService } from '@/domains/shared/ai/ai-tutor-analytics.service';

@Injectable()
export class AiUsageService {
  constructor(
    @InjectModel(Community.name)
    private communityModel: Model<CommunityDocument>,
    private readonly tutorAnalytics: AiTutorAnalyticsService,
  ) {}

  async getUsage(communityId: string) {
    const community = await this.communityModel.findById(communityId).exec();
    const isPro =
      community?.pricing?.priceType === 'monthly' ||
      community?.pricing?.priceType === 'yearly';

    const limit = isPro ? 5000 : 1000;
    const used = await this.tutorAnalytics.countAssistantTurnsForCommunity(
      communityId,
    );

    return {
      success: true,
      data: {
        used,
        limit,
        percentage: limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0,
        isPro,
        planName: isPro ? 'Pro' : 'Growth',
      },
    };
  }
}
