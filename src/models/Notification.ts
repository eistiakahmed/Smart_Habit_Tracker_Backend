import mongoose, { Schema, Document, Types } from 'mongoose';

export type NotificationType = 'HABIT_REMINDER' | 'ACHIEVEMENT_UNLOCKED' | 'GOAL_COMPLETED' | 'STREAK_MILESTONE' | 'WEEKLY_REPORT';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['HABIT_REMINDER', 'ACHIEVEMENT_UNLOCKED', 'GOAL_COMPLETED', 'STREAK_MILESTONE', 'WEEKLY_REPORT'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying unread notifications
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
