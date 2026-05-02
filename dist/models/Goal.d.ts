import mongoose, { Document, Types } from 'mongoose';
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
declare const _default: mongoose.Model<IGoal, {}, {}, {}, mongoose.Document<unknown, {}, IGoal, {}, {}> & IGoal & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Goal.d.ts.map