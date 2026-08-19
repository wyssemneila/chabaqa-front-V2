import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type GoogleCalendarOAuthStateDocument = HydratedDocument<GoogleCalendarOAuthState>;

@Schema({ timestamps: true, collection: 'google_calendar_oauth_states' })
export class GoogleCalendarOAuthState {
  @Prop({ type: Types.ObjectId, required: true, index: true }) userId: Types.ObjectId;
  @Prop({ required: true, unique: true, select: false }) stateHash: string;
  @Prop({ type: Date, required: true }) expiresAt: Date;
}

export const GoogleCalendarOAuthStateSchema = SchemaFactory.createForClass(GoogleCalendarOAuthState);
GoogleCalendarOAuthStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
