import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IHabitLog extends Document {
  habitId: Types.ObjectId;
  userId: Types.ObjectId;
  completedAt: Date;
  note?: string;
  mood?: number;
  createdAt: Date;
}

const HabitLogSchema = new Schema<IHabitLog>(
  {
    habitId: {
      type: Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
      required: true,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    mood: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index for one log per habit per user per day
HabitLogSchema.index({ userId: 1, completedAt: -1 });

export default mongoose.model<IHabitLog>('HabitLog', HabitLogSchema);
