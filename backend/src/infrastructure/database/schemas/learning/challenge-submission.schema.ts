import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChallengeSubmissionDocument = ChallengeSubmission & Document;

@Schema({ timestamps: true })
export class ChallengeSubmission {
  @Prop({ type: Types.ObjectId, ref: 'Challenge', required: true })
  challengeId: Types.ObjectId;

  @Prop({ required: true })
  taskId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content: string; // Text description or comment

  @Prop({ type: [String], default: [] })
  links: string[]; // Links to project (GitHub, Figma, etc.)

  @Prop({ type: [String], default: [] })
  files: string[]; // Uploaded file URLs

  @Prop({
    type: String,
    enum: ['pending', 'approved', 'rejected', 'feedback_required'],
    default: 'pending'
  })
  status: 'pending' | 'approved' | 'rejected' | 'feedback_required';

  @Prop({ trim: true })
  feedback?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop()
  reviewedAt?: Date;

  @Prop({ type: Number, default: 0 })
  pointsAwarded: number;

  /** Monotonic learner attempt number; rejected work remains review history. */
  @Prop({ type: Number, required: true, min: 1, default: 1 })
  attempt: number;

  /** Instant AI coach feedback generated on submission (review-before-override). */
  @Prop({ trim: true })
  aiFeedback?: string;
}

export const ChallengeSubmissionSchema = SchemaFactory.createForClass(ChallengeSubmission);

// Multiple attempts are retained. The service prevents concurrent pending work
// and makes approval final for a learner/task.
ChallengeSubmissionSchema.index({ challengeId: 1, userId: 1, taskId: 1, createdAt: -1 });
ChallengeSubmissionSchema.index({ status: 1 });
ChallengeSubmissionSchema.index({ userId: 1 });
