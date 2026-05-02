import mongoose, { Schema, Document, Types } from 'mongoose';

export type ActivityType =
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPTED'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'LEVEL_UP'
  | 'STREAK_MILESTONE'
  | 'GOAL_COMPLETED'
  | 'CHALLENGE_COMPLETED'
  | 'HABIT_SHARED';

export interface ISocialActivity extends Document {
  userId: Types.ObjectId;
  type: ActivityType;
  data: Record<string, any>;
  isPublic: boolean;
  createdAt: Date;
}

const SocialActivitySchema = new Schema<ISocialActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'ACHIEVEMENT_UNLOCKED', 'LEVEL_UP', 'STREAK_MILESTONE', 'GOAL_COMPLETED', 'CHALLENGE_COMPLETED', 'HABIT_SHARED'],
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

SocialActivitySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<ISocialActivity>('SocialActivity', SocialActivitySchema);
