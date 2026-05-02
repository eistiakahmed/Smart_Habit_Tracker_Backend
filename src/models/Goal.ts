import mongoose, { Schema, Document, Types } from 'mongoose';

export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'PAUSED';

export interface IGoal extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit?: string;
  startDate: Date;
  targetDate: Date;
  status: GoalStatus;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
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
    targetValue: {
      type: Number,
      required: true,
      min: 1,
    },
    currentValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    targetDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'FAILED', 'PAUSED'],
      default: 'ACTIVE',
      index: true,
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

// Compound index for efficient queries
GoalSchema.index({ userId: 1, status: 1 });

export default mongoose.model<IGoal>('Goal', GoalSchema);
