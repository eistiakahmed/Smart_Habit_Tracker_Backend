import mongoose, { Document, Types } from 'mongoose';
export interface IUserAchievement extends Document {
    userId: Types.ObjectId;
    achievementId: Types.ObjectId;
    unlockedAt: Date;
    progress: number;
}
declare const _default: mongoose.Model<IUserAchievement, {}, {}, {}, mongoose.Document<unknown, {}, IUserAchievement, {}, {}> & IUserAchievement & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=UserAchievement.d.ts.map