import mongoose, { Schema, Document, Types } from 'mongoose';

export type Frequency = 'DAILY' | 'WEEKLY' | 'CUSTOM';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface IHabit extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  category: string;
  color: string;
  icon?: string;
  frequency: Frequency;
  targetDays: number;
  startDate: Date;
  endDate?: Date;
  reminderTime?: string;
  isActive: boolean;
  difficulty: Difficulty;
  createdAt: Date;
  updatedAt: Date;
}

const HabitSchema = new Schema<IHabit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    color: {
      type: String,
      default: '#3B82F6',
    },
    icon: String,
    frequency: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'CUSTOM'],
      default: 'DAILY',
    },
    targetDays: {
      type: Number,
      default: 30,
      min: 1,
      max: 365,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: Date,
    reminderTime: String,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
HabitSchema.index({ userId: 1, isActive: 1 });
HabitSchema.index({ createdAt: -1 });

export default mongoose.model<IHabit>('Habit', HabitSchema);
