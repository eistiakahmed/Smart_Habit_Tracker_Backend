import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IAchievement, {}, {}, {}, mongoose.Document<unknown, {}, IAchievement, {}, {}> & IAchievement & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Achievement.d.ts.map