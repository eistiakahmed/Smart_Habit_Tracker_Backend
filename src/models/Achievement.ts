import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
  title: string;
  description: string;
  icon: string;
  badgeColor: string;
  requirement: Record<string, any>;
  points: number;
  category: string;
  createdAt: Date;
}

const AchievementSchema = new Schema<IAchievement>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
    },
    badgeColor: {
      type: String,
      required: true,
    },
    requirement: {
      type: Schema.Types.Mixed,
      required: true,
    },
    points: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAchievement>('Achievement', AchievementSchema);
