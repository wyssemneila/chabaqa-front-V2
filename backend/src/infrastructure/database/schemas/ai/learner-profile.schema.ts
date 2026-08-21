import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

/**
 * Cross-course AI learner profile. Lightweight, persisted per-user, and
 * fed into the AI tutor's system prompt + learning path reranker so the
 * assistant can personalize answers across chapters and courses.
 *
 * Kept intentionally small: updated lazily from tutor interactions and/or
 * explicit user input. No PII beyond what the user volunteers.
 */
@Schema({ timestamps: true, collection: 'learner_profiles' })
export class LearnerProfile {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  /** Self-declared skill level. */
  @Prop({
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', ''],
    default: '',
  })
  skillLevel: string;

  /** Free-text learning goals (also reused by LearningPath reranker). */
  @Prop({ type: String, default: '', trim: true })
  goals: string;

  /** Preferred explanation style, e.g. "analogies", "concise", "examples". */
  @Prop({ type: String, default: '', trim: true })
  preferredLearningStyle: string;

  /** Topics the learner has struggled with (updated from tutor signals). */
  @Prop({ type: [String], default: [] })
  weakTopics: string[];

  /** Topics the learner is interested in. */
  @Prop({ type: [String], default: [] })
  interests: string[];

  /** Preferred answer language (ISO code), empty = auto-detect. */
  @Prop({ type: String, default: '', trim: true })
  preferredLanguage: string;

  /** Last time the profile was (re)computed from tutor signals. */
  @Prop({ type: Date })
  lastSignaledAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const LearnerProfileSchema = SchemaFactory.createForClass(LearnerProfile);
LearnerProfileSchema.index({ userId: 1 }, { unique: true });
