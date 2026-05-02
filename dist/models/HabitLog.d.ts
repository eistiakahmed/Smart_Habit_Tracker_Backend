import mongoose, { Document, Types } from 'mongoose';
export interface IHabitLog extends Document {
    habitId: Types.ObjectId;
    userId: Types.ObjectId;
    completedAt: Date;
    note?: string;
    mood?: number;
    createdAt: Date;
}
declare const _default: mongoose.Model<IHabitLog, {}, {}, {}, mongoose.Document<unknown, {}, IHabitLog, {}, {}> & IHabitLog & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=HabitLog.d.ts.map