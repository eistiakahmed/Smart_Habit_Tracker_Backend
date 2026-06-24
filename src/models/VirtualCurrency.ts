import mongoose, { Schema, Document, Types } from 'mongoose';

export type CurrencyType = 'HABIT_COINS' | 'STREAK_TOKENS' | 'ACHIEVEMENT_GEMS';
export type TransactionType = 'EARN' | 'SPEND' | 'TRANSFER' | 'INVEST' | 'REWARD' | 'PENALTY';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';

export interface IWallet extends Document {
  userId: Types.ObjectId;

  // Currency balances
  balances: {
    habitCoins: number; // Primary currency
    streakTokens: number; // Premium currency
    achievementGems: number; // Rare currency
  };

  // Economic stats
  stats: {
    totalEarned: number;
    totalSpent: number;
    netWorth: number;
    transactionCount: number;
    averageDailyEarnings: number;
    highestBalance: number;
    earningStreak: number; // Current earning streak (days)
  };

  // Investment portfolio
  investments: Array<{
    habitId: Types.ObjectId;
    amount: number;
    investedAt: Date;
    currentValue: number;
    returns: number; // Percentage
    autoReinvest: boolean;
  }>;

  // Passive income sources
  passiveIncome: {
    streakBonus: number; // Daily bonus for maintaining streaks
    referralBonus: number; // Bonus from referred users
    achievementDividend: number; // Regular dividend from achievements
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  walletId: Types.ObjectId;

  // Transaction details
  type: TransactionType;
  currency: CurrencyType;
  amount: number;
  status: TransactionStatus;

  // Related entities
  relatedHabitId?: Types.ObjectId;
  relatedAchievementId?: Types.ObjectId;
  relatedUserId?: Types.ObjectId; // For transfers

  // Description and metadata
  description: string;
  metadata: {
    source?: string; // What triggered this transaction
    category?: string; // For grouping/analytics
    notes?: string;
    ipAddress?: string;
    userAgent?: string;
  };

  // Transaction timestamps
  completedAt?: Date;
  expiresAt?: Date; // For pending transactions

  createdAt: Date;
}

export interface IMarketplaceListing extends Document {
  userId: Types.ObjectId;
  habitId?: Types.ObjectId; // If listing a habit
  itemId?: string; // Unique identifier for the listing

  // Listing details
  listingType: 'HABIT' | 'TEMPLATE' | 'POWERUP' | 'CUSTOM';
  title: string;
  description: string;
  price: number;
  currency: CurrencyType;

  // Marketplace data
  category: string;
  tags: string[];
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

  // Listing stats
  stats: {
    views: number;
    likes: number;
    sales: number;
    revenue: number;
    rating: number; // 1-5
    reviewCount: number;
  };

  // Status
  status: 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'WITHDRAWN';
  expiresAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface IPowerUp extends Document {
  userId: Types.ObjectId;

  // Power-up details
  type: 'STREAK_FREEZE' | 'DOUBLE_REWARDS' | 'INSTANT_COMPLETE' | 'HABIT_BOOST' | 'TIME_WARP';
  name: string;
  description: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

  // Power-up properties
  effects: {
    duration?: number; // In hours
    multiplier?: number; // For reward multipliers
    protection?: number; // For streak protection
    boost?: number; // For habit performance boost
  };

  // Usage
  uses: number;
  maxUses: number;
  active: boolean;
  activatedAt?: Date;
  expiresAt?: Date;

  // Related entities
  targetHabitId?: Types.ObjectId;

  createdAt: Date;
}

// Wallet Schema
const WalletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    balances: {
      habitCoins: { type: Number, default: 0, min: 0 },
      streakTokens: { type: Number, default: 0, min: 0 },
      achievementGems: { type: Number, default: 0, min: 0 },
    },
    stats: {
      totalEarned: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      netWorth: { type: Number, default: 0 },
      transactionCount: { type: Number, default: 0 },
      averageDailyEarnings: { type: Number, default: 0 },
      highestBalance: { type: Number, default: 0 },
      earningStreak: { type: Number, default: 0 },
    },
    investments: [{
      habitId: { type: Schema.Types.ObjectId, ref: 'Habit' },
      amount: Number,
      investedAt: Date,
      currentValue: Number,
      returns: Number,
      autoReinvest: Boolean,
    }],
    passiveIncome: {
      streakBonus: { type: Number, default: 0 },
      referralBonus: { type: Number, default: 0 },
      achievementDividend: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Transaction Schema
const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['EARN', 'SPEND', 'TRANSFER', 'INVEST', 'REWARD', 'PENALTY'],
      required: true,
    },
    currency: {
      type: String,
      enum: ['HABIT_COINS', 'STREAK_TOKENS', 'ACHIEVEMENT_GEMS'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED'],
      default: 'PENDING',
      index: true,
    },
    relatedHabitId: { type: Schema.Types.ObjectId, ref: 'Habit' },
    relatedAchievementId: { type: Schema.Types.ObjectId, ref: 'Achievement' },
    relatedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, required: true },
    metadata: {
      source: String,
      category: String,
      notes: String,
      ipAddress: String,
      userAgent: String,
    },
    completedAt: Date,
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// Marketplace Schema
const MarketplaceSchema = new Schema<IMarketplaceListing>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    habitId: { type: Schema.Types.ObjectId, ref: 'Habit' },
    itemId: { type: String, unique: true, sparse: true },
    listingType: {
      type: String,
      enum: ['HABIT', 'TEMPLATE', 'POWERUP', 'CUSTOM'],
      required: true,
    },
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 1000 },
    price: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      enum: ['HABIT_COINS', 'STREAK_TOKENS', 'ACHIEVEMENT_GEMS'],
      required: true,
    },
    category: { type: String, required: true },
    tags: [String],
    rarity: {
      type: String,
      enum: ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'],
      default: 'COMMON',
    },
    stats: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      sales: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      rating: { type: Number, default: 0, min: 1, max: 5 },
      reviewCount: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SOLD', 'EXPIRED', 'WITHDRAWN'],
      default: 'ACTIVE',
      index: true,
    },
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// PowerUp Schema
const PowerUpSchema = new Schema<IPowerUp>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['STREAK_FREEZE', 'DOUBLE_REWARDS', 'INSTANT_COMPLETE', 'HABIT_BOOST', 'TIME_WARP'],
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    rarity: {
      type: String,
      enum: ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'],
      required: true,
    },
    effects: {
      duration: Number,
      multiplier: Number,
      protection: Number,
      boost: Number,
    },
    uses: { type: Number, default: 0 },
    maxUses: { type: Number, required: true },
    active: { type: Boolean, default: true },
    activatedAt: Date,
    expiresAt: Date,
    targetHabitId: { type: Schema.Types.ObjectId, ref: 'Habit' },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
WalletSchema.index({ userId: 1 });
WalletSchema.index({ 'balances.habitCoins': -1 });
WalletSchema.index({ 'stats.netWorth': -1 });

TransactionSchema.index({ userId: 1, status: 1 });
TransactionSchema.index({ walletId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, currency: 1 });
TransactionSchema.index({ createdAt: -1 }); // For recent transactions

MarketplaceSchema.index({ userId: 1, status: 1 });
MarketplaceSchema.index({ listingType: 1, category: 1 });
MarketplaceSchema.index({ price: 1 });
MarketplaceSchema.index({ 'stats.rating': -1 });
MarketplaceSchema.index({ rarity: 1 });

PowerUpSchema.index({ userId: 1, active: 1 });
PowerUpSchema.index({ type: 1, rarity: 1 });

// Virtual for total portfolio value
WalletSchema.virtual('portfolioValue').get(function(this: IWallet) {
  return this.balances.habitCoins +
    this.balances.streakTokens * 10 + // Streak tokens worth 10x
    this.balances.achievementGems * 50 + // Gems worth 50x
    this.investments.reduce((sum, inv) => sum + inv.currentValue, 0);
});

export const Wallet = mongoose.model<IWallet>('Wallet', WalletSchema);
export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
export const MarketplaceListing = mongoose.model<IMarketplaceListing>('MarketplaceListing', MarketplaceSchema);
export const PowerUp = mongoose.model<IPowerUp>('PowerUp', PowerUpSchema);
