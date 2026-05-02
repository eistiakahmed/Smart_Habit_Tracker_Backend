import { Types, startOfDay, endOfDay } from 'mongoose';
import Habit, { IHabit } from '@/models/Habit';
import HabitLog from '@/models/HabitLog';
import User from '@/models/User';
import DateUtil from '@/utils/date';
import logger from '@/utils/logger';
import {
  CreateHabitData,
  UpdateHabitData,
  ToggleHabitData,
  HabitFilter,
  HabitStats,
  HabitProgress,
  HabitStreak,
} from '@/types';

class HabitService {
  async getAllHabits(userId: string, filter?: HabitFilter) {
    try {
      const where: any = { userId: new Types.ObjectId(userId) };

      if (filter?.category) {
        where.category = filter.category;
      }

      if (filter?.isActive !== undefined) {
        where.isActive = filter.isActive;
      }

      const page = filter?.page || 1;
      const limit = filter?.limit || 20;
      const skip = (page - 1) * limit;

      const [habits, total] = await Promise.all([
        Habit.find(where)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .lean(),
        Habit.countDocuments(where),
      ]);

      // Get today's completion status and stats for each habit
      const habitsWithStats = await Promise.all(
        habits.map(async (habit) => {
          const stats = await this.getHabitStats(habit._id.toString(), userId);
          const todayCompleted = await this.isCompletedToday(habit._id.toString(), userId);

          return {
            ...habit,
            id: habit._id.toString(),
            stats,
            todayCompleted,
          };
        })
      );

      return {
        habits: habitsWithStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Get habits error:', error);
      throw error;
    }
  }

  async getHabitById(habitId: string, userId: string) {
    try {
      const habit = await Habit.findOne({
        _id: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
      }).lean();

      if (!habit) {
        throw new Error('Habit not found');
      }

      const stats = await this.getHabitStats(habitId, userId);
      const recentLogs = await HabitLog.find({ habitId: new Types.ObjectId(habitId) })
        .sort({ completedAt: -1 })
        .limit(7)
        .lean();

      return {
        ...habit,
        id: habit._id.toString(),
        stats,
        recentLogs,
      };
    } catch (error: any) {
      logger.error('Get habit error:', error);
      throw error;
    }
  }

  async createHabit(userId: string, data: CreateHabitData) {
    try {
      // Check user's active habits limit
      const activeHabitsCount = await Habit.countDocuments({
        userId: new Types.ObjectId(userId),
        isActive: true,
      });

      if (activeHabitsCount >= 20) {
        throw new Error('Maximum active habits limit reached (20)');
      }

      const habit = await Habit.create({
        userId: new Types.ObjectId(userId),
        title: data.title,
        description: data.description,
        category: data.category,
        color: data.color || '#3B82F6',
        icon: data.icon,
        frequency: data.frequency || 'DAILY',
        targetDays: data.targetDays || 30,
        reminderTime: data.reminderTime,
        difficulty: data.difficulty || 'MEDIUM',
      });

      logger.info(`Habit created: ${habit._id} by user ${userId}`);

      return {
        ...habit.toObject(),
        id: habit._id.toString(),
      };
    } catch (error: any) {
      logger.error('Create habit error:', error);
      throw error;
    }
  }

  async updateHabit(habitId: string, userId: string, data: UpdateHabitData) {
    try {
      const habit = await Habit.findOneAndUpdate(
        {
          _id: new Types.ObjectId(habitId),
          userId: new Types.ObjectId(userId),
        },
        { $set: data },
        { new: true, runValidators: true }
      );

      if (!habit) {
        throw new Error('Habit not found');
      }

      logger.info(`Habit updated: ${habitId}`);

      return {
        ...habit.toObject(),
        id: habit._id.toString(),
      };
    } catch (error: any) {
      logger.error('Update habit error:', error);
      throw error;
    }
  }

  async deleteHabit(habitId: string, userId: string) {
    try {
      const habit = await Habit.findOne({
        _id: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
      });

      if (!habit) {
        throw new Error('Habit not found');
      }

      // Soft delete
      await Habit.findByIdAndUpdate(habitId, { isActive: false });

      logger.info(`Habit deleted: ${habitId}`);
    } catch (error: any) {
      logger.error('Delete habit error:', error);
      throw error;
    }
  }

  async toggleHabit(habitId: string, userId: string, data: ToggleHabitData) {
    try {
      const habit = await Habit.findOne({
        _id: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
      });

      if (!habit) {
        throw new Error('Habit not found');
      }

      if (!habit.isActive) {
        throw new Error('Habit is not active');
      }

      const user = await User.findById(userId).select('timezone');
      const timezone = user?.timezone || 'UTC';
      const today = DateUtil.startOfDayInTimezone(new Date(), timezone);
      const endOfDay = DateUtil.endOfDayInTimezone(new Date(), timezone);

      // Check if already completed today
      const existingLog = await HabitLog.findOne({
        habitId: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
        completedAt: {
          $gte: today,
          $lte: endOfDay,
        },
      });

      if (existingLog) {
        // Remove the log (untoggle)
        await HabitLog.deleteOne({ _id: existingLog._id });

        logger.info(`Habit unmarked: ${habitId} by user ${userId}`);

        return {
          log: null,
          streak: await this.getCurrentStreak(habitId, userId, timezone),
          todayCompleted: false,
        };
      }

      // Mark as completed
      const log = await HabitLog.create({
        habitId: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
        note: data.note,
        mood: data.mood,
      });

      const streak = await this.getCurrentStreak(habitId, userId, timezone);

      logger.info(`Habit marked: ${habitId} by user ${userId}`);

      return {
        log: {
          ...log.toObject(),
          id: log._id.toString(),
        },
        streak,
        todayCompleted: true,
      };
    } catch (error: any) {
      logger.error('Toggle habit error:', error);
      throw error;
    }
  }

  async getHabitStats(habitId: string, userId: string): Promise<HabitStats> {
    try {
      const habit = await Habit.findById(habitId);

      if (!habit) {
        throw new Error('Habit not found');
      }

      const user = await User.findById(userId).select('timezone');
      const timezone = user?.timezone || 'UTC';
      const startDate = DateUtil.startOfDayInTimezone(habit.startDate, timezone);
      const endDate = DateUtil.endOfDayInTimezone(new Date(), timezone);

      // Get all logs within habit period
      const logs = await HabitLog.find({
        habitId: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
        completedAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .sort({ completedAt: 1 })
        .lean();

      const completedDates = logs.map((log) => log.completedAt);
      const totalDays = DateUtil.getDaysBetween(startDate, endDate);
      const daysCompleted = completedDates.length;

      const streakInfo = DateUtil.getStreakDates(completedDates, timezone);

      // Calculate average mood
      const moodSum = logs.reduce((sum, log) => sum + (log.mood || 0), 0);
      const averageMood = logs.length > 0 ? moodSum / logs.length : undefined;

      return {
        currentStreak: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak,
        completionRate: totalDays > 0 ? (daysCompleted / totalDays) * 100 : 0,
        daysCompleted,
        totalDays,
        averageMood,
      };
    } catch (error: any) {
      logger.error('Get habit stats error:', error);
      throw error;
    }
  }

  async getHabitProgress(habitId: string, userId: string, startDate?: Date, endDate?: Date): Promise<HabitProgress> {
    try {
      const habit = await Habit.findById(habitId);

      if (!habit) {
        throw new Error('Habit not found');
      }

      const user = await User.findById(userId).select('timezone');
      const timezone = user?.timezone || 'UTC';

      const periodStart = startDate || DateUtil.startOfMonthInTimezone(new Date(), timezone);
      const periodEnd = endDate || DateUtil.endOfDayInTimezone(new Date(), timezone);

      // Get logs for period
      const logs = await HabitLog.find({
        habitId: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
        completedAt: {
          $gte: periodStart,
          $lte: periodEnd,
        },
      })
        .sort({ completedAt: 1 })
        .lean();

      const totalDays = DateUtil.getDaysBetween(periodStart, periodEnd);
      const completedDates = logs.map((log) => log.completedAt);
      const streakInfo = DateUtil.getStreakDates(completedDates, timezone);

      // Daily progress
      const dailyProgress = [];
      let currentDate = periodStart;

      while (currentDate <= periodEnd) {
        const isCompleted = completedDates.some((date) =>
          DateUtil.isToday(date, timezone) && date.toDateString() === currentDate.toDateString()
        );

        dailyProgress.push({
          date: currentDate.toISOString().split('T')[0],
          completed: isCompleted,
        });

        currentDate = DateUtil.addDaysInTimezone(currentDate, 1, timezone);
      }

      // Weekly summary
      const weeklySummary = this.calculateWeeklySummary(completedDates, periodStart, periodEnd, timezone);

      return {
        habitId,
        period: {
          startDate: periodStart,
          endDate: periodEnd,
        },
        stats: {
          currentStreak: streakInfo.currentStreak,
          longestStreak: streakInfo.longestStreak,
          completionRate: totalDays > 0 ? (completedDates.length / totalDays) * 100 : 0,
          daysCompleted: completedDates.length,
          totalDays,
        },
        dailyProgress,
        weeklySummary,
      };
    } catch (error: any) {
      logger.error('Get habit progress error:', error);
      throw error;
    }
  }

  async getHabitStreak(habitId: string, userId: string): Promise<HabitStreak> {
    try {
      const habit = await Habit.findById(habitId);

      if (!habit) {
        throw new Error('Habit not found');
      }

      const user = await User.findById(userId).select('timezone');
      const timezone = user?.timezone || 'UTC';
      const startDate = DateUtil.startOfDayInTimezone(habit.startDate, timezone);
      const endDate = DateUtil.endOfDayInTimezone(new Date(), timezone);

      const logs = await HabitLog.find({
        habitId: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
        completedAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .sort({ completedAt: 1 })
        .lean();

      const completedDates = logs.map((log) => log.completedAt);
      const streakInfo = DateUtil.getStreakDates(completedDates, timezone);

      // Calculate milestones
      const milestones = [
        { days: 7, achieved: false },
        { days: 14, achieved: false },
        { days: 21, achieved: false },
        { days: 30, achieved: false },
        { days: 60, achieved: false },
        { days: 90, achieved: false },
        { days: 100, achieved: false },
        { days: 365, achieved: false },
      ];

      for (const streak of streakInfo.streakHistory) {
        for (const milestone of milestones) {
          if (!milestone.achieved && streak.days >= milestone.days) {
            milestone.achieved = true;
            milestone.date = streak.endDate.toISOString();
          }
        }
      }

      // Check current streak
      if (streakInfo.currentStreak > 0) {
        for (const milestone of milestones) {
          if (!milestone.achieved && streakInfo.currentStreak >= milestone.days) {
            milestone.achieved = true;
            milestone.date = new Date().toISOString();
          }
        }
      }

      return {
        currentStreak: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak,
        streakHistory: streakInfo.streakHistory.map((s) => ({
          startDate: s.startDate.toISOString(),
          endDate: s.endDate.toISOString(),
          days: s.days,
        })),
        milestones,
      };
    } catch (error: any) {
      logger.error('Get habit streak error:', error);
      throw error;
    }
  }

  private async isCompletedToday(habitId: string, userId: string): Promise<boolean> {
    const user = await User.findById(userId).select('timezone');
    const timezone = user?.timezone || 'UTC';
    const today = DateUtil.startOfDayInTimezone(new Date(), timezone);
    const endOfDay = DateUtil.endOfDayInTimezone(new Date(), timezone);

    const log = await HabitLog.findOne({
      habitId: new Types.ObjectId(habitId),
      userId: new Types.ObjectId(userId),
      completedAt: {
        $gte: today,
        $lte: endOfDay,
      },
    });

    return !!log;
  }

  private async getCurrentStreak(habitId: string, userId: string, timezone: string): Promise<number> {
    const habit = await Habit.findById(habitId);

    if (!habit) {
      return 0;
    }

    const startDate = DateUtil.startOfDayInTimezone(habit.startDate, timezone);
    const endDate = DateUtil.endOfDayInTimezone(new Date(), timezone);

    const logs = await HabitLog.find({
      habitId: new Types.ObjectId(habitId),
      userId: new Types.ObjectId(userId),
      completedAt: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .sort({ completedAt: 1 })
      .lean();

    const completedDates = logs.map((log) => log.completedAt);
    const streakInfo = DateUtil.getStreakDates(completedDates, timezone);

    return streakInfo.currentStreak;
  }

  private calculateWeeklySummary(
    completedDates: Date[],
    startDate: Date,
    endDate: Date,
    timezone: string
  ): Array<{ weekStart: string; weekEnd: string; completed: number; total: number; rate: number }> {
    const weeks: Array<{
      weekStart: string;
      weekEnd: string;
      completed: number;
      total: number;
      rate: number;
    }> = [];

    let weekStart = DateUtil.startOfWeekInTimezone(startDate, timezone);
    let weekEnd = DateUtil.endOfWeekInTimezone(startDate, timezone);

    while (weekStart <= endDate) {
      const weekLogs = completedDates.filter((date) => date >= weekStart && date <= weekEnd);

      const totalDays = DateUtil.getDaysBetween(weekStart, weekEnd);
      const completed = weekLogs.length;
      const rate = totalDays > 0 ? (completed / totalDays) * 100 : 0;

      weeks.push({
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        completed,
        total: totalDays,
        rate: Math.round(rate),
      });

      weekStart = DateUtil.addDaysInTimezone(weekEnd, 1, timezone);
      weekEnd = DateUtil.endOfWeekInTimezone(weekStart, timezone);
    }

    return weeks;
  }
}

export default new HabitService();
