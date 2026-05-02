import mongoose, { Schema, Document, Types } from 'mongoose';

export type ChallengeType = 'HABIT_STREAK' | 'COMPLETE_ALL' | 'EARLY_BIRD' | 'NIGHT_OWL' | 'CATEGORY_MASTER' | 'NEW_HABIT';

export interface IDailyChallenge extends Document {
  title: string;
  description: string;
  type: ChallengeType;
  requirement: {
    type: string;
    value: number;
    category?: string;
  };
  reward: {
    points: number;
    xp: number;
    badge?: string;
  };
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  participants: Array<{
    userId: Types.ObjectId;
    completed: boolean;
    completedAt?: Date;
    progress: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const DailyChallengeSchema = new Schema<IDailyChallenge>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['HABIT_STREAK', 'COMPLETE_ALL', 'EARLY_BIRD', 'NIGHT_OWL', 'CATEGORY_MASTER', 'NEW_HABIT'],
      required: true,
    },
    requirement: {
      type: {
        type: String,
        required: true,
      },
      value: {
        type: Number,
        required: true,
      },
      category: {
        type: String,
      },
    },
    reward: {
      points: {
        type: Number,
        default: 0,
      },
      xp: {
        type: Number,
        default: 0,
      },
      badge: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    participants: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      completed: {
        type: Boolean,
        default: false,
      },
      completedAt: Date,
      progress: {
        type: Number,
        default: 0,
      },
    }],
  },
  {
    timestamps: true,
  }
);

DailyChallengeSchema.index({ startDate: 1, endDate: 1, isActive: 1 });

export default mongoose.model<IDailyChallenge>('DailyChallenge', DailyChallengeSchema);
