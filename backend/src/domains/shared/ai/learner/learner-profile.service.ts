import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  LearnerProfile,
} from '@/infrastructure/database/schemas/ai/learner-profile.schema';

export type LearnerProfileDocument = LearnerProfile & { _id: Types.ObjectId } & Document;

export interface UpsertLearnerProfileInput {
  skillLevel?: string;
  goals?: string;
  preferredLearningStyle?: string;
  weakTopics?: string[];
  interests?: string[];
  preferredLanguage?: string;
}

/**
 * LearnerProfileService — reads and updates a cross-course AI learner
 * profile. The profile is fed into the AI tutor's system prompt (so the
 * tutor adapts to the learner's style/weak topics) and into the learning
 * path reranker (so recommendations reflect persisted goals).
 */
@Injectable()
export class LearnerProfileService {
  private readonly logger = new Logger(LearnerProfileService.name);

  constructor(
    @InjectModel(LearnerProfile.name)
    private readonly profileModel: Model<LearnerProfileDocument>,
  ) {}

  async get(userId: string): Promise<LearnerProfileDocument | null> {
    if (!Types.ObjectId.isValid(userId)) return null;
    return this.profileModel.findOne({ userId: new Types.ObjectId(userId) }).lean().exec();
  }

  async upsert(userId: string, input: UpsertLearnerProfileInput): Promise<LearnerProfileDocument> {
    const $set: Record<string, any> = {};
    if (input.skillLevel !== undefined) $set.skillLevel = String(input.skillLevel || '').toLowerCase();
    if (input.goals !== undefined) $set.goals = String(input.goals || '').slice(0, 2000);
    if (input.preferredLearningStyle !== undefined) $set.preferredLearningStyle = String(input.preferredLearningStyle || '').slice(0, 200);
    if (input.weakTopics !== undefined) $set.weakTopics = (input.weakTopics || []).map((t) => String(t || '').trim()).filter(Boolean).slice(0, 50);
    if (input.interests !== undefined) $set.interests = (input.interests || []).map((t) => String(t || '').trim()).filter(Boolean).slice(0, 50);
    if (input.preferredLanguage !== undefined) $set.preferredLanguage = String(input.preferredLanguage || '').slice(0, 16);

    const res = await this.profileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
    return res;
  }

  /** Merge new weak topics into the existing list (deduped, capped). */
  async addWeakTopics(userId: string, topics: string[]): Promise<void> {
    const clean = topics.map((t) => String(t || '').trim()).filter(Boolean);
    if (!clean.length) return;
    await this.profileModel.updateOne(
      { userId: new Types.ObjectId(userId) },
      {
        $addToSet: { weakTopics: { $each: clean.slice(0, 10) } },
        $set: { lastSignaledAt: new Date() },
      },
      { upsert: true },
    ).exec();
  }

  /**
   * Build a compact text summary of the profile suitable for injection into
   * the tutor's system prompt. Returns an empty string when nothing useful
   * is recorded so callers can skip the section entirely.
   */
  buildProfileSummary(profile: LearnerProfileDocument | null): string {
    if (!profile) return '';
    const lines: string[] = [];
    const level = String(profile.skillLevel || '').trim();
    if (level) lines.push(`Skill level: ${level}`);
    const style = String(profile.preferredLearningStyle || '').trim();
    if (style) lines.push(`Preferred style: ${style}`);
    const lang = String(profile.preferredLanguage || '').trim();
    if (lang) lines.push(`Preferred language: ${lang}`);
    const goals = String(profile.goals || '').trim();
    if (goals) lines.push(`Goals: ${goals}`);
    if (profile.weakTopics?.length) lines.push(`Weak topics: ${profile.weakTopics.join(', ')}`);
    if (profile.interests?.length) lines.push(`Interests: ${profile.interests.join(', ')}`);
    return lines.join('\n');
  }
}
