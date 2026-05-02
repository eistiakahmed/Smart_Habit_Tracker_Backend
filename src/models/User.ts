import mongoose, { Schema, Document } from 'mongoose';

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

  // Gamification fields
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

  // Social fields
  bio?: string;
  isPublicProfile: boolean;
  friends: Types.ObjectId[];
  pendingFriends: Types.ObjectId[];
  blockedUsers: Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    preferences: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastActive: Date,

    // Gamification fields
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    streakFreezes: {
      type: Number,
      default: 1,
      min: 0,
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    badges: {
      type: [
        {
          badgeId: String,
          unlockedAt: Date,
        },
      ],
      default: [],
    },

    // Social fields
    bio: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    isPublicProfile: {
      type: Boolean,
      default: false,
    },
    friends: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    pendingFriends: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    blockedUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', UserSchema);
