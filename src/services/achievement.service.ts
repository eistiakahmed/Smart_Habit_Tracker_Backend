import { Types } from 'mongoose';
import { User, Achievement, UserAchievement, Habit, HabitLog, Goal } from '@/models';
import { AchievementResponse, UserAchievementResponse } from '@/types';
import logger from '@/utils/logger';

interface AchievementCheckResult {
  unlocked: AchievementResponse[];
  progress: Array<{ achievementId: string; progress: number }>;
  pointsEarned: number;
  xpEarned: number;
}

class AchievementService {
  // predefined achievements that will be seeded
  getPredefinedAchievements() {
    return [
      // Streak achievements
      {
        title: 'First Steps',
        description: 'Complete your first habit',
        icon: '👣',
        badgeColor: '#10B981',
        requirement: { type: 'first_habit', value: 1 },
        points: 10,
        xp: 5,
        category: 'streak',
      },
      {
        title: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        badgeColor: '#F59E0B',
        requirement: { type: 'streak_days', value: 7 },
        points: 50,
        xp: 25,
        category: 'streak',
      },
      {
        title: 'Month Master',
        description: 'Maintain a 30-day streak',
        icon: '🏆',
        badgeColor: '#8B5CF6',
        requirement: { type: 'streak_days', value: 30 },
        points: 200,
        xp: 100,
        category: 'streak',
      },
      {
        title: 'Centurion',
        description: 'Maintain a 100-day streak',
        icon: '💎',
        badgeColor: '#EC4899',
        requirement: { type: 'streak_days', value: 100 },
        points: 500,
        xp: 250,
        category: 'streak',
      },
      // Completion achievements
      {
        title: 'Goal Getter',
        description: 'Complete your first goal',
        icon: '🎯',
        badgeColor: '#3B82F6',
        requirement: { type: 'goals_completed', value: 1 },
        points: 25,
        xp: 10,
        category: 'completion',
      },
      {
        title: 'Triple Threat',
        description: 'Complete 3 goals',
        icon: '🎖️',
        badgeColor: '#6366F1',
        requirement: { type: 'goals_completed', value: 3 },
        points: 75,
        xp: 35,
        category: 'completion',
      },
      // Consistency achievements
      {
        title: 'Daily Devotee',
        description: 'Complete all habits for 7 days in a row',
        icon: '📅',
        badgeColor: '#14B8A6',
        requirement: { type: 'perfect_week', value: 1 },
        points: 100,
        xp: 50,
        category: 'consistency',
      },
      {
        title: 'Habit Hero',
        description: 'Create 5 different habits',
        icon: '🦸',
        badgeColor: '#F97316',
        requirement: { type: 'habits_created', value: 5 },
        points: 30,
        xp: 15,
        category: 'creation',
      },
      // Category achievements
      {
        title: 'Health Nut',
        description: 'Complete 50 health habits',
        icon: '🍎',
        badgeColor: '#22C55E',
        requirement: { type: 'category_completions', category: 'health', value: 50 },
        points: 100,
        xp: 50,
        category: 'category',
      },
      {
        title: 'Bookworm',
        description: 'Complete 30 learning habits',
        icon: '📚',
        badgeColor: '#0EA5E9',
        requirement: { type: 'category_completions', category: 'learning', value: 30 },
        points: 75,
        xp: 35,
        category: 'category',
      },
      // Special achievements
      {
        title: 'Early Bird',
        description: 'Complete a habit before 7 AM for 7 days',
        icon: '🐦',
        badgeColor: '#FCD34D',
        requirement: { type: 'early_bird', value: 7 },
        points: 50,
        xp: 25,
        category: 'special',
      },
      {
        title: 'Night Owl',
        description: 'Complete a habit after 10 PM for 7 days',
        icon: '🦉',
        badgeColor: '#64748B',
        requirement: { type: 'night_owl', value: 7 },
        points: 50,
        xp: 25,
        category: 'special',
      },
      {
        title: 'Rising Star',
        description: 'Reach level 5',
        icon: '⭐',
        badgeColor: '#FBBF24',
        requirement: { type: 'level', value: 5 },
        points: 0,
        xp: 0,
        category: 'level',
      },
      {
        title: 'Legendary',
        description: 'Reach level 20',
        icon: '👑',
        badgeColor: '#FBBF24',
        requirement: { type: 'level', value: 20 },
        points: 0,
        xp: 0,
        category: 'level',
      },
    ];
  }

  async seedAchievements(): Promise<void> {
    try {
      const predefined = this.getPredefinedAchievements();

      for (const achievement of predefined) {
        const existing = await Achievement.findOne({ title: achievement.title });
        if (!existing) {
          await Achievement.create(achievement);
          logger.info(`Seeded achievement: ${achievement.title}`);
        }
      }

      logger.info('Achievement seeding completed');
    } catch (error: any) {
      logger.error('Seed achievements error:', error);
      throw error;
    }
  }

  async getAllAchievements(): Promise<AchievementResponse[]> {
    try {
      const achievements = await Achievement.find().sort({ category: 1, points: -1 }).lean();

      return achievements.map((a) => ({
        ...a,
        id: a._id.toString(),
      }));
    } catch (error: any) {
      logger.error('Get achievements error:', error);
      throw error;
    }
  }

  async getUserAchievements(userId: string): Promise<{
    unlocked: UserAchievementResponse[];
    inProgress: Array<AchievementResponse & { progress: number }>;
  }> {
    try {
      const userAchievements = await UserAchievement.find({
        userId: new Types.ObjectId(userId),
      })
        .populate('achievementId')
        .lean();

      const allAchievements = await Achievement.find().lean();

      const unlocked: UserAchievementResponse[] = [];
      const unlockedIds = new Set<string>();

      for (const ua of userAchievements) {
        const achievement = ua.achievementId as any;
        unlocked.push({
          achievement: {
            ...achievement,
            id: achievement._id.toString(),
          },
          progress: ua.progress,
          unlockedAt: ua.unlockedAt,
        });
        unlockedIds.add(achievement._id.toString());
      }

      const inProgress = allAchievements
        .filter((a) => !unlockedIds.has(a._id.toString()))
        .map((a) => ({
          ...a,
          id: a._id.toString(),
          progress: this.calculateAchievementProgress(userId, a),
        }));

      return { unlocked, inProgress };
    } catch (error: any) {
      logger.error('Get user achievements error:', error);
      throw error;
    }
  }

  async checkAndUnlockAchievements(userId: string): Promise<AchievementCheckResult> {
    try {
      const allAchievements = await Achievement.find().lean();
      const existingUnlocked = await UserAchievement.find({
        userId: new Types.ObjectId(userId),
      }).lean();

      const unlockedIds = new Set(existingUnlocked.map((ua) => ua.achievementId.toString()));
      const newlyUnlocked: AchievementResponse[] = [];
      const progressUpdates: Array<{ achievementId: string; progress: number }> = [];
      let totalPoints = 0;
      let totalXp = 0;

      for (const achievement of allAchievements) {
        if (unlockedIds.has(achievement._id.toString())) {
          continue;
        }

        const progress = this.calculateAchievementProgress(userId, achievement);

        if (progress >= 100) {
          // Unlock achievement
          await UserAchievement.create({
            userId: new Types.ObjectId(userId),
            achievementId: achievement._id,
            unlockedAt: new Date(),
            progress: 100,
          });

          newlyUnlocked.push({
            ...achievement,
            id: achievement._id.toString(),
          });

          totalPoints += achievement.points;
          totalXp += achievement.xp;

          // Add badge to user profile
          await User.findByIdAndUpdate(userId, {
            $push: {
              badges: {
                badgeId: achievement._id.toString(),
                unlockedAt: new Date(),
              },
            },
          });

          logger.info(`Achievement unlocked: ${achievement.title} by user ${userId}`);
        } else {
          progressUpdates.push({
            achievementId: achievement._id.toString(),
            progress,
          });

          // Update progress if exists
          const existing = existingUnlocked.find(
            (ua) => ua.achievementId.toString() === achievement._id.toString()
          );
          if (existing) {
            await UserAchievement.findByIdAndUpdate(existing._id, { progress });
          }
        }
      }

      return {
        unlocked: newlyUnlocked,
        progress: progressUpdates,
        pointsEarned: totalPoints,
        xpEarned: totalXp,
      };
    } catch (error: any) {
      logger.error('Check achievements error:', error);
      throw error;
    }
  }

  private calculateAchievementProgress(userId: string, achievement: any): number {
    const { requirement } = achievement;

    switch (requirement.type) {
      case 'first_habit':
        return this.hasCompletedAnyHabit(userId) ? 100 : 0;

      case 'streak_days': {
        const maxStreak = this.getUserMaxStreak(userId);
        return Math.min(100, (maxStreak / requirement.value) * 100);
      }

      case 'goals_completed': {
        const completedGoals = this.getCompletedGoalsCount(userId);
        return Math.min(100, (completedGoals / requirement.value) * 100);
      }

      case 'perfect_week':
        return this.hasPerfectWeek(userId) ? 100 : 0;

      case 'habits_created': {
        const habitsCreated = this.getHabitsCreatedCount(userId);
        return Math.min(100, (habitsCreated / requirement.value) * 100);
      }

      case 'category_completions': {
        const categoryCompletions = this.getCategoryCompletions(userId, requirement.category);
        return Math.min(100, (categoryCompletions / requirement.value) * 100);
      }

      case 'early_bird':
      case 'night_owl':
        return this.getSpecialHabitCount(userId, requirement.type) >= requirement.value ? 100 : 0;

      case 'level': {
        const userLevel = this.getUserLevel(userId);
        return Math.min(100, (userLevel / requirement.value) * 100);
      }

      default:
        return 0;
    }
  }

  private async hasCompletedAnyHabit(userId: string): Promise<boolean> {
    const count = await HabitLog.countDocuments({ userId: new Types.ObjectId(userId) });
    return count > 0;
  }

  private async getUserMaxStreak(userId: string): Promise<number> {
    const user = await User.findById(userId).select('longestStreak');
    return user?.longestStreak || 0;
  }

  private async getCompletedGoalsCount(userId: string): Promise<number> {
    return Goal.countDocuments({
      userId: new Types.ObjectId(userId),
      status: 'COMPLETED',
    });
  }

  private async hasPerfectWeek(userId: string): Promise<boolean> {
    // Check if user has 7 consecutive days with all habits completed
    const logs = await HabitLog.find({ userId: new Types.ObjectId(userId) })
      .sort({ completedAt: -1 })
      .limit(100)
      .lean();

    if (logs.length < 7) return false;

    const dates = new Set(logs.map((log) => log.completedAt.toDateString()));
    let consecutiveDays = 0;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);

      if (dates.has(checkDate.toDateString())) {
        consecutiveDays++;
        if (consecutiveDays >= 7) return true;
      } else {
        consecutiveDays = 0;
      }
    }

    return false;
  }

  private async getHabitsCreatedCount(userId: string): Promise<number> {
    return Habit.countDocuments({ userId: new Types.ObjectId(userId) });
  }

  private async getCategoryCompletions(userId: string, category: string): Promise<number> {
    const habitIds = await Habit.find({
      userId: new Types.ObjectId(userId),
      category,
    }).distinct('_id');

    return HabitLog.countDocuments({
      habitId: { $in: habitIds },
      userId: new Types.ObjectId(userId),
    });
  }

  private async getSpecialHabitCount(userId: string, type: string): Promise<number> {
    const isEarly = type === 'early_bird';
    const hour = isEarly ? 7 : 22;

    const count = await HabitLog.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
        },
      },
      {
        $project: {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          hour: { $hour: '$completedAt' },
        },
      },
      {
        $match: {
          hour: isEarly ? { $lt: hour } : { $gte: hour },
        },
      },
      {
        $group: {
          _id: '$day',
        },
      },
      {
        $count: 'days',
      },
    ]);

    return count[0]?.days || 0;
  }

  private async getUserLevel(userId: string): Promise<number> {
    const user = await User.findById(userId).select('level');
    return user?.level || 1;
  }
}

export default new AchievementService();
