import mongoose, { Document, Types } from 'mongoose';
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
declare const _default: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification, {}, {}> & INotification & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Notification.d.ts.map