import { Types } from 'mongoose';
import { User, Habit, HabitLog } from '@/models';
import achievementService from './achievement.service';
import logger from '@/utils/logger';

interface LevelReward {
  level: number;
  points: number;
  streakFreezes: number;
}

class GamificationService {
  // XP required for each level
  private readonly levelXPRequirements: Record<number, number> = {
    1: 0,
    2: 100,
    3: 250,
    4: 450,
    5: 700,
    6: 1000,
    7: 1350,
    8: 1750,
    9: 2200,
    10: 2700,
    11: 3250,
    12: 3850,
    13: 4500,
    14: 5200,
    15: 5950,
    16: 6750,
    17: 7600,
    18: 8500,
    19: 9450,
    20: 10500,
  };

  private readonly levelRewards: Record<number, LevelReward> = {
    5: { level: 5, points: 100, streakFreezes: 1 },
    10: { level: 10, points: 500, streakFreezes: 2 },
    15: { level: 15, points: 1000, streakFreezes: 3 },
    20: { level: 20, points: 2500, streakFreezes: 5 },
  };

  // Points awarded for different activities
  private readonly pointsConfig = {
    habitComplete: 10,
    habitStreakDay: 5,
    goalComplete: 100,
    achievementUnlock: 50,
    challengeComplete: 75,
    levelUp: 25,
    perfectDay: 20,
  };

  // XP awarded for different activities
  private readonly xpConfig = {
    habitComplete: 5,
    habitStreakDay: 2,
    goalComplete: 50,
    achievementUnlock: 25,
    challengeComplete: 35,
    levelUp: 10,
    perfectDay: 10,
  };

  async awardPoints(userId: string, points: number, reason: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(userId, {
        $inc: { points: points },
      });

      logger.info(`Awarded ${points} points to user ${userId} for ${reason}`);
    } catch (error: any) {
      logger.error('Award points error:', error);
      throw error;
    }
  }

  async awardXP(userId: string, xp: number): Promise<{
    leveledUp: boolean;
    newLevel?: number;
    rewards?: LevelReward;
  }> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const oldLevel = user.level;
      const newXP = user.xp + xp;
      const newLevel = this.calculateLevelFromXP(newXP);

      const updateData: any = {
        xp: newXP,
      };

      if (newLevel > oldLevel) {
        updateData.level = newLevel;
        updateData.currentStreak = user.currentStreak + 1;

        // Check for level rewards
        const rewards = this.levelRewards[newLevel as keyof typeof this.levelRewards];
        if (rewards) {
          updateData.points = user.points + rewards.points;
          updateData.streakFreezes = user.streakFreezes + rewards.streakFreezes;
        }

        await User.findByIdAndUpdate(userId, { $set: updateData });

        logger.info(`User ${userId} leveled up to ${newLevel}`);

        // Check for level-based achievements
        await achievementService.checkAndUnlockAchievements(userId);

        return {
          leveledUp: true,
          newLevel,
          rewards: this.levelRewards[newLevel as keyof typeof this.levelRewards],
        };
      }

      await User.findByIdAndUpdate(userId, { $set: { xp: newXP } });

      return { leveledUp: false };
    } catch (error: any) {
      logger.error('Award XP error:', error);
      throw error;
    }
  }

  async useStreakFreeze(userId: string, habitId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);

      if (!user || user.streakFreezes <= 0) {
        return false;
      }

      // Check if streak was actually broken
      const habit = await Habit.findOne({
        _id: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
      });

      if (!habit) {
        return false;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const log = await HabitLog.findOne({
        habitId: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
        completedAt: {
          $gte: new Date(yesterday.setHours(0, 0, 0, 0)),
          $lte: new Date(yesterday.setHours(23, 59, 59, 999)),
        },
      });

      if (!log) {
        // Streak was broken, use freeze
        await User.findByIdAndUpdate(userId, {
          $inc: { streakFreezes: -1 },
        });

        // Create a fake log to maintain streak
        await HabitLog.create({
          habitId: new Types.ObjectId(habitId),
          userId: new Types.ObjectId(userId),
          note: 'Streak freeze used',
        });

        logger.info(`User ${userId} used streak freeze for habit ${habitId}`);
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('Use streak freeze error:', error);
      throw error;
    }
  }

  async onHabitComplete(userId: string, habitId: string): Promise<{
    pointsEarned: number;
    xpEarned: number;
    streakBonus: boolean;
    achievements: any[];
  }> {
    try {
      let points = this.pointsConfig.habitComplete;
      let xp = this.xpConfig.habitComplete;
      let streakBonus = false;

      const habit = await Habit.findOne({
        _id: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
      });

      if (!habit) {
        throw new Error('Habit not found');
      }

      // Check for streak bonus
      const user = await User.findById(userId);
      if (user && user.currentStreak > 0 && user.currentStreak % 7 === 0) {
        const bonusPoints = this.pointsConfig.habitStreakDay * user.currentStreak;
        points += bonusPoints;
        xp += this.xpConfig.habitStreakDay * user.currentStreak;
        streakBonus = true;
      }

      // Award points and XP
      await this.awardPoints(userId, points, 'Habit completion');
      const levelResult = await this.awardXP(userId, xp);

      // Check for achievements
      const achievementResult = await achievementService.checkAndUnlockAchievements(userId);

      // Award achievement points and XP
      if (achievementResult.pointsEarned > 0 || achievementResult.xpEarned > 0) {
        await this.awardPoints(userId, achievementResult.pointsEarned, 'Achievement unlock');
        await this.awardXP(userId, achievementResult.xpEarned);
      }

      return {
        pointsEarned: points + achievementResult.pointsEarned,
        xpEarned: xp + achievementResult.xpEarned,
        streakBonus,
        achievements: achievementResult.unlocked,
      };
    } catch (error: any) {
      logger.error('On habit complete error:', error);
      throw error;
    }
  }

  async onGoalComplete(userId: string, goalId: string): Promise<{
    pointsEarned: number;
    xpEarned: number;
    achievements: any[];
  }> {
    try {
      const points = this.pointsConfig.goalComplete;
      const xp = this.xpConfig.goalComplete;

      await this.awardPoints(userId, points, 'Goal completion');
      await this.awardXP(userId, xp);

      const achievementResult = await achievementService.checkAndUnlockAchievements(userId);

      if (achievementResult.pointsEarned > 0 || achievementResult.xpEarned > 0) {
        await this.awardPoints(userId, achievementResult.pointsEarned, 'Achievement unlock');
        await this.awardXP(userId, achievementResult.xpEarned);
      }

      return {
        pointsEarned: points + achievementResult.pointsEarned,
        xpEarned: xp + achievementResult.xpEarned,
        achievements: achievementResult.unlocked,
      };
    } catch (error: any) {
      logger.error('On goal complete error:', error);
      throw error;
    }
  }

  async getLeaderboard(params: {
    limit?: number;
    period?: 'all' | 'week' | 'month';
    category?: string;
  }): Promise<Array<{
    userId: string;
    username: string;
    avatar?: string;
    level: number;
    points: number;
    rank: number;
  }>> {
    try {
      const limit = params.limit || 50;

      let matchQuery: any = {};

      if (params.period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchQuery.updatedAt = { $gte: weekAgo };
      } else if (params.period === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchQuery.updatedAt = { $gte: monthAgo };
      }

      const leaderboard = await User.find(matchQuery)
        .select('username avatar level points')
        .sort({ points: -1, level: -1 })
        .limit(limit)
        .lean();

      return leaderboard.map((user, index) => ({
        userId: user._id.toString(),
        username: user.username,
        avatar: user.avatar,
        level: user.level,
        points: user.points,
        rank: index + 1,
      }));
    } catch (error: any) {
      logger.error('Get leaderboard error:', error);
      throw error;
    }
  }

  async getUserRank(userId: string): Promise<{
    rank: number;
    totalUsers: number;
    percentile: number;
  }> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const rank = await User.countDocuments({
        $or: [{ points: { $gt: user.points } }, { points: user.points, level: { $gt: user.level } }],
      });

      const totalUsers = await User.countDocuments();

      return {
        rank: rank + 1,
        totalUsers,
        percentile: Math.round(((totalUsers - rank) / totalUsers) * 100),
      };
    } catch (error: any) {
      logger.error('Get user rank error:', error);
      throw error;
    }
  }

  async getUserGamificationStats(userId: string): Promise<{
    points: number;
    level: number;
    xp: number;
    xpToNextLevel: number;
    xpProgress: number;
    streakFreezes: number;
    currentStreak: number;
    longestStreak: number;
    badges: Array<{
      badgeId: string;
      unlockedAt: Date;
    }>;
  }> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const currentLevelXP = this.levelXPRequirements[user.level] || 0;
      const nextLevelXP = this.levelXPRequirements[user.level + 1] || currentLevelXP;
      const xpInCurrentLevel = user.xp - currentLevelXP;
      const xpNeededForNextLevel = nextLevelXP - currentLevelXP;

      return {
        points: user.points,
        level: user.level,
        xp: user.xp,
        xpToNextLevel: xpNeededForNextLevel,
        xpProgress: xpNeededForNextLevel > 0 ? (xpInCurrentLevel / xpNeededForNextLevel) * 100 : 100,
        streakFreezes: user.streakFreezes,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        badges: user.badges || [],
      };
    } catch (error: any) {
      logger.error('Get user gamification stats error:', error);
      throw error;
    }
  }

  private calculateLevelFromXP(totalXP: number): number {
    let level = 1;
    for (const [lvl, requiredXP] of Object.entries(this.levelXPRequirements)) {
      if (totalXP >= requiredXP) {
        level = parseInt(lvl);
      } else {
        break;
      }
    }
    return Math.min(level, 20); // Max level is 20
  }
}

export default new GamificationService();
