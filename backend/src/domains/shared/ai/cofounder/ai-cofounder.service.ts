import { Injectable } from '@nestjs/common';
import { AiLaunchPlanService } from './ai-launch-plan.service';
import { AiPublishService } from '../ai-publish.service';
import {
  BuildCommunityDto,
  CreateLaunchPlanDto,
  PublishDraftDto,
} from './dto/ai-cofounder.dto';

@Injectable()
export class AiCofounderService {
  constructor(
    private readonly launchPlanService: AiLaunchPlanService,
    private readonly publishService: AiPublishService,
  ) {}

  buildCommunity(input: BuildCommunityDto) {
    const title = `${input.niche} Studio`;
    return {
      type: 'community',
      reviewBadge: 'AI · Review before publish',
      draft: {
        nom: title,
        description: `${input.promise} for ${input.audience}.`,
        price: input.price ?? 0,
        currency: input.currency || 'TND',
        status: 'draft',
      },
      landingCopy: {
        headline: title,
        subheadline: input.promise,
        bullets: [
          `Built for ${input.audience}`,
          'Clear onboarding path',
          'Weekly creator-led momentum',
        ],
      },
      posts: [
        {
          title: 'Welcome and first win',
          content: `Introduce yourself and share what ${input.promise} means for you.`,
        },
        {
          title: 'Resource thread',
          content: 'Drop your best templates, examples, and questions here.',
        },
        {
          title: 'Accountability check-in',
          content:
            'What did you try this week, and what should we improve next?',
        },
      ],
    };
  }

  createLaunchPlan(input: CreateLaunchPlanDto, creatorId: string) {
    return this.launchPlanService.create(
      input.communityId,
      creatorId,
      input.durationDays,
      input.goal,
    );
  }

  fixFunnel(communityId: string) {
    return {
      communityId,
      reviewBadge: 'AI · Review before publish',
      insights: [
        'Tighten the promise above the fold',
        'Add a proof block before pricing',
        'Send one recovery email to warm leads',
      ],
      suggestedCopy: {
        headline: 'Make the first outcome obvious',
        cta: 'Start with the first lesson',
      },
    };
  }

  grow(communityId: string) {
    return {
      communityId,
      reviewBadge: 'AI · Review before publish',
      inactiveMembersQuery: { inactiveForDays: 14 },
      campaignDraft: {
        subject: 'A small reset for this week',
        preview: 'Come back with one simple action.',
        body: 'We prepared a small next step so you can regain momentum without catching up on everything.',
      },
    };
  }

  publishDraft(input: PublishDraftDto) {
    return this.publishService.publishDraft(
      input.draftType,
      input.draftPayload,
      input.confirm,
    );
  }
}
