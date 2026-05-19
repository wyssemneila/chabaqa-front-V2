import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AiLaunchPlan,
  AiLaunchPlanDocument,
} from '@/infrastructure/database/schemas/ai/ai-launch-plan.schema';

@Injectable()
export class AiLaunchPlanService {
  constructor(
    @InjectModel(AiLaunchPlan.name)
    private readonly launchPlanModel: Model<AiLaunchPlanDocument>,
  ) {}

  async create(
    communityId: string,
    creatorId: string,
    durationDays: 7 | 14 | 30,
    goal: string,
  ) {
    const checkpoints =
      durationDays === 7
        ? [1, 2, 3, 4, 5, 6, 7]
        : durationDays === 14
          ? [1, 2, 4, 6, 8, 10, 12, 14]
          : [1, 3, 5, 8, 12, 16, 20, 24, 27, 30];
    const tasks = checkpoints.map((day, index) => ({
      day,
      title:
        index === 0
          ? 'Define the launch promise'
          : index === checkpoints.length - 1
            ? 'Review and open enrollment'
            : `Launch action ${index + 1}`,
      description:
        index === 0
          ? `Clarify the public promise for ${goal}.`
          : `Complete a focused launch action that moves members toward ${goal}.`,
      actionType:
        index % 3 === 0
          ? 'copy_review'
          : index % 3 === 1
            ? 'community_post'
            : 'email_draft',
    }));
    return this.launchPlanModel.create({
      communityId: new Types.ObjectId(communityId),
      creatorId: new Types.ObjectId(creatorId),
      durationDays,
      tasks,
      status: 'draft',
    });
  }
}
