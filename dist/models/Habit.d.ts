import mongoose, { Document, Types } from 'mongoose';
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
declare const _default: mongoose.Model<IHabit, {}, {}, {}, mongoose.Document<unknown, {}, IHabit, {}, {}> & IHabit & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Habit.d.ts.map