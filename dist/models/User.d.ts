import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    email: string;
    username: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    timezone: string;
    preferences: Record<string, any>;
    isActive: boolean;
    emailVerified: boolean;
    verificationToken?: string;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=User.d.ts.map