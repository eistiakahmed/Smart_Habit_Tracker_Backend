import { Types } from 'mongoose';
import { Wallet, Transaction, MarketplaceListing, PowerUp } from '@/models/VirtualCurrency';
import User from '@/models/User';
import Habit from '@/models/Habit';
import HabitLog from '@/models/HabitLog';
import logger from '@/utils/logger';
import DateUtil from '@/utils/date';

class VirtualEconomyService {
  // Wallet Management

  async getUserWallet(userId: string): Promise<any> {
    try {
      let wallet = await Wallet.findOne({ userId: new Types.ObjectId(userId) });

      if (!wallet) {
        wallet = await this.createWallet(userId);
      }

      return wallet;
    } catch (error: any) {
      logger.error('Get user wallet error:', error);
      throw error;
    }
  }

  async getWalletBalance(userId: string): Promise<any> {
    try {
      const wallet = await this.getUserWallet(userId);

      return {
        habitCoins: wallet.balances.habitCoins,
        streakTokens: wallet.balances.streakTokens,
        achievementGems: wallet.balances.achievementGems,
        totalWorth: this.calculateTotalBalance(wallet),
        stats: wallet.stats,
      };
    } catch (error: any) {
      logger.error('Get wallet balance error:', error);
      throw error;
    }
  }

  async createWallet(userId: string): Promise<any> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Starting bonus for new users
      const startingBonus = 100;

      const wallet = await Wallet.create({
        userId: new Types.ObjectId(userId),
        balances: {
          habitCoins: startingBonus,
          streakTokens: 5, // Small amount of premium currency
          achievementGems: 1, // One gem to start
        },
        stats: {
          totalEarned: startingBonus,
          netWorth: startingBonus,
          highestBalance: startingBonus,
        },
      });

      // Record the starting bonus transaction
      await this.createTransaction(userId, wallet._id.toString(), {
        type: 'REWARD',
        currency: 'HABIT_COINS',
        amount: startingBonus,
        description: 'Welcome bonus - starting currency',
        metadata: {
          source: 'new_user_bonus',
          category: 'bonus',
        },
      });

      logger.info(`Wallet created for user ${userId} with ${startingBonus} HabitCoins bonus`);

      return wallet;
    } catch (error: any) {
      logger.error('Create wallet error:', error);
      throw error;
    }
  }

  // Currency Operations

  async earnCurrency(userId: string, amount: number, currency: string = 'HABIT_COINS', details: any = {}): Promise<any> {
    try {
      const wallet = await this.getUserWallet(userId);

      // Update balance
      const balanceField = `balances.${this.currencyToField(currency)}`;
      const updatedWallet = await Wallet.findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        {
          $inc: {
            [balanceField]: amount,
            'stats.totalEarned': amount,
            'stats.transactionCount': 1,
          },
        },
        { new: true }
      );

      // Update highest balance if needed
      const newTotal = this.calculateTotalBalance(updatedWallet!);
      if (newTotal > updatedWallet!.stats.highestBalance) {
        await Wallet.findOneAndUpdate(
          { userId: new Types.ObjectId(userId) },
          { $set: { 'stats.highestBalance': newTotal } }
        );
      }

      // Record transaction
      await this.createTransaction(userId, wallet._id.toString(), {
        type: 'EARN',
        currency: currency as any,
        amount,
        description: details.description || 'Currency earned',
        relatedHabitId: details.habitId,
        relatedAchievementId: details.achievementId,
        metadata: {
          source: details.source || 'habit_completion',
          category: details.category || 'earning',
        },
      });

      // Update earning streak
      await this.updateEarningStreak(userId);

      logger.info(`User ${userId} earned ${amount} ${currency}`);

      return updatedWallet;
    } catch (error: any) {
      logger.error('Earn currency error:', error);
      throw error;
    }
  }

  async spendCurrency(userId: string, amount: number, currency: string = 'HABIT_COINS', details: any = {}): Promise<any> {
    try {
      const wallet = await this.getUserWallet(userId);
      const balanceField = `balances.${this.currencyToField(currency)}`;

      // Check sufficient balance
      const currentBalance = (wallet.balances as any)[this.currencyToField(currency)];
      if (currentBalance < amount) {
        throw new Error(`Insufficient ${currency} balance`);
      }

      // Update balance
      const updatedWallet = await Wallet.findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        {
          $inc: {
            [balanceField]: -amount,
            'stats.totalSpent': amount,
            'stats.transactionCount': 1,
          },
        },
        { new: true }
      );

      // Record transaction
      await this.createTransaction(userId, wallet._id.toString(), {
        type: 'SPEND',
        currency: currency as any,
        amount,
        description: details.description || 'Currency spent',
        metadata: {
          source: details.source || 'purchase',
          category: details.category || 'spending',
        },
      });

      logger.info(`User ${userId} spent ${amount} ${currency}`);

      return updatedWallet;
    } catch (error: any) {
      logger.error('Spend currency error:', error);
      throw error;
    }
  }

  async transferCurrency(fromUserId: string, toUserId: string, amount: number, currency: string = 'HABIT_COINS', _description: string = 'Transfer'): Promise<any> {
    try {
      if (fromUserId === toUserId) {
        throw new Error('Cannot transfer to yourself');
      }

      // Deduct from sender
      await this.spendCurrency(fromUserId, amount, currency, {
        description: `Transfer to user ${toUserId}`,
        relatedUserId: new Types.ObjectId(toUserId),
        metadata: { source: 'transfer', category: 'transfer' },
      });

      // Add to recipient
      await this.earnCurrency(toUserId, amount, currency, {
        description: `Transfer from user ${fromUserId}`,
        relatedUserId: new Types.ObjectId(fromUserId),
        metadata: { source: 'transfer', category: 'transfer' },
      });

      logger.info(`Transfer of ${amount} ${currency} from ${fromUserId} to ${toUserId}`);

      return { success: true, message: 'Transfer completed' };
    } catch (error: any) {
      logger.error('Transfer currency error:', error);
      throw error;
    }
  }

  // Habit Completion Rewards

  async calculateHabitReward(habitId: string, userId: string): Promise<number> {
    try {
      const habit = await Habit.findOne({
        _id: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
      });

      if (!habit) {
        throw new Error('Habit not found');
      }

      let baseReward = 10; // Base reward for any habit

      // Difficulty multiplier
      const difficultyMultiplier = habit.difficulty === 'HARD' ? 2 : habit.difficulty === 'EASY' ? 0.5 : 1;

      // Current streak bonus
      const logs = await HabitLog.find({
        habitId: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
      }).sort({ completedAt: -1 }).limit(30);

      let streakBonus = 0;
      const today = DateUtil.startOfDayInTimezone(new Date(), 'UTC');
      const consecutiveDays = this.calculateConsecutiveDays(logs, today);

      if (consecutiveDays >= 30) streakBonus = 50;
      else if (consecutiveDays >= 14) streakBonus = 25;
      else if (consecutiveDays >= 7) streakBonus = 10;
      else if (consecutiveDays >= 3) streakBonus = 5;

      // First completion bonus
      const isFirstCompletion = logs.length === 1;
      const firstBonus = isFirstCompletion ? 20 : 0;

      // Calculate final reward
      const totalReward = Math.round(baseReward * difficultyMultiplier + streakBonus + firstBonus);

      return totalReward;
    } catch (error: any) {
      logger.error('Calculate habit reward error:', error);
      throw error;
    }
  }

  async processHabitCompletion(habitId: string, userId: string): Promise<any> {
    try {
      const reward = await this.calculateHabitReward(habitId, userId);

      // Award the currency
      await this.earnCurrency(userId, reward, 'HABIT_COINS', {
        description: `Completed habit: ${habitId}`,
        habitId: new Types.ObjectId(habitId),
        source: 'habit_completion',
        category: 'habit_rewards',
      });

      // Check for streak token rewards (rare)
      await this.checkStreakTokenReward(userId, habitId);

      // Check for achievement gem rewards (very rare)
      await this.checkAchievementGemReward(userId, habitId);

      return {
        reward,
        breakdown: {
          base: 10,
          difficulty: Math.round(reward * 0.2),
          streak: Math.round(reward * 0.3),
          first: Math.round(reward * 0.1),
        },
      };
    } catch (error: any) {
      logger.error('Process habit completion error:', error);
      throw error;
    }
  }

  // Marketplace Functions

  async createListing(userId: string, listingData: any): Promise<any> {
    try {
      const listing = await MarketplaceListing.create({
        userId: new Types.ObjectId(userId),
        habitId: listingData.habitId ? new Types.ObjectId(listingData.habitId) : undefined,
        itemId: this.generateItemId(),
        listingType: listingData.listingType,
        title: listingData.title,
        description: listingData.description,
        price: listingData.price,
        currency: listingData.currency,
        category: listingData.category,
        tags: listingData.tags || [],
        rarity: listingData.rarity || 'COMMON',
        expiresAt: listingData.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      logger.info(`Marketplace listing created: ${listing._id} by user ${userId}`);

      return listing;
    } catch (error: any) {
      logger.error('Create listing error:', error);
      throw error;
    }
  }

  async purchaseListing(buyerUserId: string, listingId: string): Promise<any> {
    try {
      const listing = await MarketplaceListing.findOne({
        _id: new Types.ObjectId(listingId),
        status: 'ACTIVE',
      }).populate('habitId');

      if (!listing) {
        throw new Error('Listing not found or not active');
      }

      if (listing.userId.toString() === buyerUserId) {
        throw new Error('Cannot purchase your own listing');
      }

      if (listing.expiresAt && listing.expiresAt < new Date()) {
        throw new Error('Listing has expired');
      }

      // Check buyer has sufficient funds
      const buyerWallet = await this.getUserWallet(buyerUserId);
      const buyerBalance = (buyerWallet.balances as any)[this.currencyToField(listing.currency)];

      if (buyerBalance < listing.price) {
        throw new Error(`Insufficient ${listing.currency} balance`);
      }

      // Process payment
      await this.spendCurrency(buyerUserId, listing.price, listing.currency, {
        description: `Purchase: ${listing.title}`,
        metadata: { source: 'marketplace', category: 'purchase' },
      });

      // Pay seller (minus marketplace fee)
      const marketplaceFee = Math.round(listing.price * 0.1); // 10% fee
      const sellerPayment = listing.price - marketplaceFee;

      await this.earnCurrency(listing.userId.toString(), sellerPayment, listing.currency, {
        description: `Sold: ${listing.title}`,
        metadata: { source: 'marketplace', category: 'sale' },
      });

      // Update listing stats
      await MarketplaceListing.findOneAndUpdate(
        { _id: listing._id },
        {
          $inc: {
            'stats.sales': 1,
            'stats.revenue': listing.price,
          },
          $set: { status: 'SOLD' },
        }
      );

      // If it's a habit, clone it for the buyer
      if (listing.listingType === 'HABIT' && listing.habitId) {
        await this.cloneHabitForBuyer(buyerUserId, listing.habitId._id.toString());
      }

      logger.info(`Marketplace purchase: listing ${listingId} by user ${buyerUserId}`);

      return {
        success: true,
        listing,
        payment: {
          price: listing.price,
          fee: marketplaceFee,
          sellerReceived: sellerPayment,
        },
      };
    } catch (error: any) {
      logger.error('Purchase listing error:', error);
      throw error;
    }
  }

  async searchMarketplace(filters: any = {}): Promise<any[]> {
    try {
      const where: any = { status: 'ACTIVE' };

      if (filters.listingType) where.listingType = filters.listingType;
      if (filters.category) where.category = filters.category;
      if (filters.rarity) where.rarity = filters.rarity;
      if (filters.minPrice) where.price = { ...where.price, $gte: filters.minPrice };
      if (filters.maxPrice) where.price = { ...where.price, $lte: filters.maxPrice };
      if (filters.search) {
        where.$or = [
          { title: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } },
        ];
      }

      const listings = await MarketplaceListing.find(where)
        .populate('userId', 'username avatar')
        .populate('habitId')
        .sort({ 'stats.rating': -1, createdAt: -1 })
        .limit(filters.limit || 50);

      return listings;
    } catch (error: any) {
      logger.error('Search marketplace error:', error);
      throw error;
    }
  }

  async getTransactionHistory(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const wallet = await this.getUserWallet(userId);

      const transactions = await Transaction.find({
        walletId: wallet._id,
      })
        .sort({ createdAt: -1 })
        .limit(limit);

      return transactions;
    } catch (error: any) {
      logger.error('Get transaction history error:', error);
      throw error;
    }
  }

  // Power-Up Functions

  async grantPowerUp(userId: string, powerUpData: any): Promise<any> {
    try {
      const powerUp = await PowerUp.create({
        userId: new Types.ObjectId(userId),
        type: powerUpData.type,
        name: powerUpData.name,
        description: powerUpData.description,
        rarity: powerUpData.rarity || 'COMMON',
        effects: powerUpData.effects || {},
        maxUses: powerUpData.maxUses || 1,
        targetHabitId: powerUpData.targetHabitId ? new Types.ObjectId(powerUpData.targetHabitId) : undefined,
      });

      logger.info(`Power-up granted to user ${userId}: ${powerUp.type}`);

      return powerUp;
    } catch (error: any) {
      logger.error('Grant power-up error:', error);
      throw error;
    }
  }

  async usePowerUp(userId: string, powerUpId: string): Promise<any> {
    try {
      const powerUp = await PowerUp.findOne({
        _id: new Types.ObjectId(powerUpId),
        userId: new Types.ObjectId(userId),
        active: true,
      });

      if (!powerUp) {
        throw new Error('Power-up not found or not active');
      }

      if (powerUp.uses >= powerUp.maxUses) {
        throw new Error('Power-up has no remaining uses');
      }

      // Apply power-up effects based on type
      const result = await this.applyPowerUpEffects(powerUp);

      // Update usage
      powerUp.uses += 1;
      if (powerUp.uses >= powerUp.maxUses) {
        powerUp.active = false;
      }
      await powerUp.save();

      logger.info(`Power-up used: ${powerUpId} by user ${userId}`);

      return {
        powerUp,
        result,
        remainingUses: powerUp.maxUses - powerUp.uses,
      };
    } catch (error: any) {
      logger.error('Use power-up error:', error);
      throw error;
    }
  }

  async getUserPowerUps(userId: string): Promise<any[]> {
    try {
      const powerUps = await PowerUp.find({
        userId: new Types.ObjectId(userId),
        active: true,
      }).sort({ rarity: -1, createdAt: -1 });

      return powerUps;
    } catch (error: any) {
      logger.error('Get user power-ups error:', error);
      throw error;
    }
  }

  // Economy Analytics

  async getEconomyStats(userId: string): Promise<any> {
    try {
      const wallet = await this.getUserWallet(userId);

      // Recent transactions
      const recentTransactions = await Transaction.find({
        userId: new Types.ObjectId(userId),
      })
        .sort({ createdAt: -1 })
        .limit(10);

      // Spending breakdown by category
      const spendingByCategory = await Transaction.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            type: 'SPEND',
          },
        },
        {
          $group: {
            _id: '$metadata.category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { total: -1 },
          },
        ]);

      // Earning breakdown by category
      const earningByCategory = await Transaction.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            type: 'EARN',
          },
        },
        {
          $group: {
            _id: '$metadata.category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { total: -1 },
        },
      ]);

      return {
        wallet,
        recentTransactions,
        analytics: {
          spendingByCategory,
          earningByCategory,
          netFlow: wallet.stats.totalEarned - wallet.stats.totalSpent,
          efficiency: wallet.stats.totalSpent > 0
            ? Math.round((wallet.stats.totalEarned / wallet.stats.totalSpent) * 100)
            : 100,
        },
      };
    } catch (error: any) {
      logger.error('Get economy stats error:', error);
      throw error;
    }
  }

  // Helper Methods

  private async createTransaction(userId: string, walletId: string, data: any): Promise<any> {
    try {
      const transaction = await Transaction.create({
        userId: new Types.ObjectId(userId),
        walletId: new Types.ObjectId(walletId),
        type: data.type,
        currency: data.currency,
        amount: data.amount,
        description: data.description,
        relatedHabitId: data.relatedHabitId,
        relatedAchievementId: data.relatedAchievementId,
        relatedUserId: data.relatedUserId,
        metadata: data.metadata || {},
        completedAt: new Date(),
      });

      return transaction;
    } catch (error: any) {
      logger.error('Create transaction error:', error);
      throw error;
    }
  }

  private currencyToField(currency: string): string {
    const mapping: any = {
      'HABIT_COINS': 'habitCoins',
      'STREAK_TOKENS': 'streakTokens',
      'ACHIEVEMENT_GEMS': 'achievementGems',
    };
    return mapping[currency] || 'habitCoins';
  }

  private calculateTotalBalance(wallet: any): number {
    return wallet.balances.habitCoins +
      wallet.balances.streakTokens * 10 +
      wallet.balances.achievementGems * 50;
  }

  private calculateConsecutiveDays(logs: any[], today: Date): number {
    let consecutiveDays = 0;
    let currentDate = today;

    for (const log of logs) {
      const logDate = DateUtil.startOfDayInTimezone(log.completedAt, 'UTC');
      const diffDays = DateUtil.getDaysBetween(logDate, currentDate);

      if (diffDays === consecutiveDays) {
        consecutiveDays++;
        currentDate = new Date(logDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }

    return consecutiveDays;
  }

  private async updateEarningStreak(userId: string): Promise<void> {
    const today = DateUtil.startOfDayInTimezone(new Date(), 'UTC');
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    // Check if user earned anything yesterday
    const yesterdayEarnings = await Transaction.countDocuments({
      userId: new Types.ObjectId(userId),
      type: 'EARN',
      completedAt: {
        $gte: yesterday,
        $lt: today,
      },
    });

    if (yesterdayEarnings > 0) {
      await Wallet.findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $inc: { 'stats.earningStreak': 1 } }
      );
    }
  }

  private async checkStreakTokenReward(userId: string, _habitId: string): Promise<void> {
    // Small chance (1%) to award a streak token for habit completion
    if (Math.random() < 0.01) {
      await this.earnCurrency(userId, 1, 'STREAK_TOKENS', {
        description: 'Lucky streak token reward!',
        metadata: { source: 'lucky_reward', category: 'bonus' },
      });
    }
  }

  private async checkAchievementGemReward(userId: string, _habitId: string): Promise<void> {
    // Very small chance (0.1%) to award an achievement gem
    if (Math.random() < 0.001) {
      await this.earnCurrency(userId, 1, 'ACHIEVEMENT_GEMS', {
        description: 'Ultra rare achievement gem!',
        metadata: { source: 'ultra_rare_reward', category: 'bonus' },
      });
    }
  }

  private generateItemId(): string {
    return `ITEM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async cloneHabitForBuyer(buyerUserId: string, habitId: string): Promise<void> {
    const originalHabit = await Habit.findById(habitId);
    if (!originalHabit) return;

    await Habit.create({
      userId: new Types.ObjectId(buyerUserId),
      title: `${originalHabit.title} (Copy)`,
      description: originalHabit.description,
      category: originalHabit.category,
      color: originalHabit.color,
      difficulty: originalHabit.difficulty,
      targetDays: originalHabit.targetDays,
    });
  }

  private async applyPowerUpEffects(powerUp: any): Promise<any> {
    switch (powerUp.type) {
      case 'STREAK_FREEZE':
        return { effect: 'streak_protected', duration: powerUp.effects.duration || 24 };
      case 'DOUBLE_REWARDS':
        return { effect: 'double_rewards', multiplier: powerUp.effects.multiplier || 2 };
      case 'INSTANT_COMPLETE':
        return { effect: 'instant_complete', success: true };
      case 'HABIT_BOOST':
        return { effect: 'habit_boost', boost: powerUp.effects.boost || 20 };
      case 'TIME_WARP':
        return { effect: 'time_warp', hours: powerUp.effects.duration || 1 };
      default:
        return { effect: 'unknown' };
    }
  }
}

export default new VirtualEconomyService();