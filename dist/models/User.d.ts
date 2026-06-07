import mongoose, { Document, Types } from 'mongoose';
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
    lastActive?: Date;
    points: number;
    level: number;
    xp: number;
    streakFreezes: number;
    currentStreak: number;
    longestStreak: number;
    badges: Array<{
        badgeId: string;
        unlockedAt: Date;
    }>;
    bio?: string;
    isPublicProfile: boolean;
    friends: Types.ObjectId[];
    pendingFriends: Types.ObjectId[];
    blockedUsers: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=User.d.ts.map