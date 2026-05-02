import { Types } from 'mongoose';
import { Habit, HabitLog, Goal, User } from '@/models';
import DateUtil from '@/utils/date';
import logger from '@/utils/logger';

interface DailyStats {
  date: string;
  completed: number;
  total: number;
  rate: number;
  mood?: number;
}

interface WeeklyReport {
  week: {
    start: string;
    end: string;
  };
  summary: {
    totalHabits: number;
    totalCompletions: number;
    completionRate: number;
    perfectDays: number;
    bestDay: string;
    worstDay: string;
    averageMood: number;
  };
  dailyBreakdown: DailyStats[];
  habitsPerformance: Array<{
    habitId: string;
    title: string;
    completed: number;
    total: number;
    rate: number;
    longestStreak: number;
    category: string;
  }>;
  categoryBreakdown: Array<{
    category: string;
    completed: number;
    total: number;
    rate: number;
  }>;
}

interface HabitPattern {
  habitId: string;
  title: string;
  bestDay: string;
  bestHour: number;
  completionByDay: Array<{
    day: string;
    rate: number;
  }>;
  completionByHour: Array<{
    hour: number;
    count: number;
  }>;
  averageMood: number;
}

interface ProductivityInsight {
  type: 'strength' | 'improvement' | 'trend' | 'streak' | 'milestone';
  title: string;
  description: string;
  data?: any;
  actionable?: boolean;
}

interface DailyProgress {
  date: string;
  summary: {
    totalHabits: number;
    completedHabits: number;
    completionRate: number;
    averageMood: number;
    currentStreak: number;
  };
  habits: Array<{
    habitId: string;
    title: string;
    category: string;
    completed: boolean;
    completedAt?: Date;
    mood?: number;
    note?: string;
    streak: number;
    icon?: string;
    color: string;
  }>;
  hourlyBreakdown: Array<{
    hour: number;
    completed: number;
  }>;
  comparison: {
    previousDay: {
      date: string;
      completionRate: number;
      completed: number;
    };
    change: {
      rate: number;
      completed: number;
    };
  };
  upcomingReminders: Array<{
    habitId: string;
    title: string;
    reminderTime: string;
  }>;
}

class AnalyticsService {
  async getWeeklyReport(userId: string, startDate?: Date, endDate?: Date): Promise<WeeklyReport> {
    try {
      const user = await User.findById(userId).select('timezone');
      const timezone = user?.timezone || 'UTC';

      const start = startDate || DateUtil.startOfWeekInTimezone(new Date(), timezone);
      const end = endDate || DateUtil.endOfWeekInTimezone(new Date(), timezone);

      const habits = await Habit.find({
        userId: new Types.ObjectId(userId),
        isActive: true,
      }).lean();

      const habitIds = habits.map((h) => h._id);

      // Get all logs for the period
      const logs = await HabitLog.find({
        habitId: { $in: habitIds },
        userId: new Types.ObjectId(userId),
        completedAt: { $gte: start, $lte: end },
      }).lean();

      // Daily breakdown
      const dailyBreakdown = this.calculateDailyStats(start, end, logs, habitIds.length, timezone);

      // Find best and worst days
      const sortedByRate = [...dailyBreakdown].sort((a, b) => b.rate - a.rate);
      const bestDay = sortedByRate[0]?.date || '';
      const worstDay = sortedByRate[sortedByRate.length - 1]?.date || '';

      // Perfect days
      const perfectDays = dailyBreakdown.filter((d) => d.completed === d.total && d.total > 0).length;

      // Habit performance
      const habitsPerformance = await Promise.all(
        habits.map(async (habit) => {
          const habitLogs = logs.filter((log) => log.habitId.toString() === habit._id.toString());
          const totalDays = DateUtil.getDaysBetween(start, end);
          const completed = habitLogs.length;

          // Calculate longest streak for this habit
          const streakInfo = await this.calculateHabitStreak(habit._id.toString(), userId);

          return {
            habitId: habit._id.toString(),
            title: habit.title,
            completed,
            total: totalDays,
            rate: totalDays > 0 ? (completed / totalDays) * 100 : 0,
            longestStreak: streakInfo.longest,
            category: habit.category,
          };
        })
      );

      // Category breakdown
      const categoryMap = new Map<string, { completed: number; total: number }>();

      for (const habit of habits) {
        const existing = categoryMap.get(habit.category) || { completed: 0, total: 0 };
        existing.total += DateUtil.getDaysBetween(start, end);

        const habitLogs = logs.filter((log) => log.habitId.toString() === habit._id.toString());
        existing.completed += habitLogs.length;

        categoryMap.set(habit.category, existing);
      }

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        completed: data.completed,
        total: data.total,
        rate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
      }));

      // Average mood
      const moodSum = logs.reduce((sum, log) => sum + (log.mood || 0), 0);
      const moodCount = logs.filter((log) => log.mood).length;
      const averageMood = moodCount > 0 ? moodSum / moodCount : 0;

      return {
        week: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        },
        summary: {
          totalHabits: habits.length,
          totalCompletions: logs.length,
          completionRate: dailyBreakdown.length > 0
            ? dailyBreakdown.reduce((sum, d) => sum + d.completed, 0) /
              dailyBreakdown.reduce((sum, d) => sum + d.total, 0) * 100
            : 0,
          perfectDays,
          bestDay,
          worstDay,
          averageMood,
        },
        dailyBreakdown,
        habitsPerformance,
        categoryBreakdown,
      };
    } catch (error: any) {
      logger.error('Get weekly report error:', error);
      throw error;
    }
  }

  async getMonthlyInsights(userId: string): Promise<{
    overview: {
      totalHabits: number;
      activeDays: number;
      totalCompletions: number;
      completionRate: number;
      currentStreak: number;
      longestStreak: number;
    };
    trends: {
      daily: Array<{ date: string; completed: number; rate: number }>;
      weekly: Array<{ week: string; completed: number; rate: number }>;
    };
    topPerformingHabits: Array<{
      habitId: string;
      title: string;
      completionRate: number;
      currentStreak: number;
    }>;
    habitsNeedingAttention: Array<{
      habitId: string;
      title: string;
      completionRate: number;
      daysSinceLastCompletion: number;
    }>;
  }> {
    try {
      const user = await User.findById(userId).select('timezone');
      const timezone = user?.timezone || 'UTC';

      const startOfMonth = DateUtil.startOfMonthInTimezone(new Date(), timezone);
      const endOfMonth = DateUtil.endOfMonthInTimezone(new Date(), timezone);
      const today = DateUtil.endOfDayInTimezone(new Date(), timezone);

      const habits = await Habit.find({
        userId: new Types.ObjectId(userId),
        isActive: true,
      }).lean();

      const habitIds = habits.map((h) => h._id);

      const logs = await HabitLog.find({
        habitId: { $in: habitIds },
        userId: new Types.ObjectId(userId),
        completedAt: { $gte: startOfMonth, $lte: endOfMonth },
      }).lean();

      const totalDays = DateUtil.getDaysBetween(startOfMonth, today);
      const activeDays = new Set(logs.map((log) => log.completedAt.toDateString())).size;

      // Calculate streaks
      const userStreak = await this.calculateOverallStreak(userId);

      // Daily trends
      const dailyTrends: Array<{ date: string; completed: number; rate: number }> = [];
      let currentDate = startOfMonth;

      while (currentDate <= today) {
        const dayLogs = logs.filter(
          (log) => log.completedAt.toDateString() === currentDate.toDateString()
        );
        dailyTrends.push({
          date: currentDate.toISOString().split('T')[0],
          completed: dayLogs.length,
          rate: habits.length > 0 ? (dayLogs.length / habits.length) * 100 : 0,
        });

        currentDate = DateUtil.addDaysInTimezone(currentDate, 1, timezone);
      }

      // Weekly trends
      const weeklyTrends = this.calculateWeeklyTrends(dailyTrends, timezone);

      // Top performing habits
      const habitPerformance = await Promise.all(
        habits.map(async (habit) => {
          const habitLogs = logs.filter((log) => log.habitId.toString() === habit._id.toString());
          const streakInfo = await this.calculateHabitStreak(habit._id.toString(), userId);

          return {
            habitId: habit._id.toString(),
            title: habit.title,
            completionRate: totalDays > 0 ? (habitLogs.length / totalDays) * 100 : 0,
            currentStreak: streakInfo.current,
          };
        })
      );

      const topPerformingHabits = [...habitPerformance]
        .sort((a, b) => b.completionRate - a.completionRate)
        .slice(0, 5);

      // Habits needing attention
      const habitsNeedingAttention = await Promise.all(
        habits.map(async (habit) => {
          const habitLogs = logs.filter((log) => log.habitId.toString() === habit._id.toString());
          const completionRate = totalDays > 0 ? (habitLogs.length / totalDays) * 100 : 0;

          const lastLog = await HabitLog.findOne({
            habitId: habit._id,
            userId: new Types.ObjectId(userId),
          })
            .sort({ completedAt: -1 })
            .lean();

          const daysSinceLastCompletion = lastLog
            ? DateUtil.getDaysBetween(new Date(lastLog.completedAt), new Date())
            : totalDays;

          return {
            habitId: habit._id.toString(),
            title: habit.title,
            completionRate,
            daysSinceLastCompletion,
          };
        })
      );

      const filteredHabitsNeedingAttention = habitsNeedingAttention
        .filter((h) => h.completionRate < 50 || h.daysSinceLastCompletion > 3)
        .sort((a, b) => a.completionRate - b.completionRate)
        .slice(0, 5);

      return {
        overview: {
          totalHabits: habits.length,
          activeDays,
          totalCompletions: logs.length,
          completionRate: totalDays > 0 && habits.length > 0 ? (logs.length / (totalDays * habits.length)) * 100 : 0,
          currentStreak: userStreak.current,
          longestStreak: userStreak.longest,
        },
        trends: {
          daily: dailyTrends,
          weekly: weeklyTrends,
        },
        topPerformingHabits,
        habitsNeedingAttention: filteredHabitsNeedingAttention,
      };
    } catch (error: any) {
      logger.error('Get monthly insights error:', error);
      throw error;
    }
  }

  async getHabitPatterns(userId: string): Promise<HabitPattern[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const habits = await Habit.find({
        userId: new Types.ObjectId(userId),
        isActive: true,
      }).lean();

      const patterns: HabitPattern[] = [];

      for (const habit of habits) {
        const logs = await HabitLog.find({
          habitId: habit._id,
          userId: new Types.ObjectId(userId),
          completedAt: { $gte: thirtyDaysAgo },
        }).lean();

        if (logs.length === 0) continue;

        // Completion by day of week
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const completionByDay = dayNames.map((day) => {
          const dayLogs = logs.filter((log) => log.completedAt.toDateString().includes(day));
          return {
            day,
            rate: logs.length > 0 ? (dayLogs.length / logs.length) * 100 : 0,
          };
        });

        const bestDay = completionByDay.sort((a, b) => b.rate - a.rate)[0]?.day || 'Unknown';

        // Completion by hour
        const hourCounts = new Map<number, number>();
        for (const log of logs) {
          const hour = log.completedAt.getHours();
          hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
        }

        const completionByHour = Array.from(hourCounts.entries())
          .map(([hour, count]) => ({ hour, count }))
          .sort((a, b) => b.count - a.count);

        const bestHour = completionByHour[0]?.hour || 0;

        // Average mood
        const moodSum = logs.reduce((sum, log) => sum + (log.mood || 0), 0);
        const moodCount = logs.filter((log) => log.mood).length;
        const averageMood = moodCount > 0 ? moodSum / moodCount : 0;

        patterns.push({
          habitId: habit._id.toString(),
          title: habit.title,
          bestDay,
          bestHour,
          completionByDay,
          completionByHour,
          averageMood,
        });
      }

      return patterns;
    } catch (error: any) {
      logger.error('Get habit patterns error:', error);
      throw error;
    }
  }

  async getProductivityInsights(userId: string): Promise<ProductivityInsight[]> {
    try {
      const insights: ProductivityInsight[] = [];

      const monthlyInsights = await this.getMonthlyInsights(userId);
      const weeklyReport = await this.getWeeklyReport(userId);
      const patterns = await this.getHabitPatterns(userId);

      // Strength insights
      if (monthlyInsights.topPerformingHabits.length > 0) {
        const topHabit = monthlyInsights.topPerformingHabits[0];
        insights.push({
          type: 'strength',
          title: 'Your Strongest Habit',
          description: `"${topHabit.title}" is your best performing habit with ${topHabit.completionRate.toFixed(0)}% completion rate!`,
          data: topHabit,
          actionable: false,
        });
      }

      // Improvement insights
      if (monthlyInsights.habitsNeedingAttention.length > 0) {
        const needAttention = monthlyInsights.habitsNeedingAttention[0];
        insights.push({
          type: 'improvement',
          title: 'Habit Needs Attention',
          description: `"${needAttention.title}" could use some focus. You haven't completed it in ${needAttention.daysSinceLastCompletion} days.`,
          data: needAttention,
          actionable: true,
        });
      }

      // Trend insights
      const lastWeekRate = weeklyReport.dailyBreakdown
        .slice(-7)
        .reduce((sum, d) => sum + d.rate, 0) / Math.min(7, weeklyReport.dailyBreakdown.length);

      const previousWeekRate = weeklyReport.dailyBreakdown
        .slice(-14, -7)
        .reduce((sum, d) => sum + d.rate, 0) / Math.min(7, weeklyReport.dailyBreakdown.length);

      if (lastWeekRate > previousWeekRate + 10) {
        insights.push({
          type: 'trend',
          title: 'Improving Trend!',
          description: `Your completion rate improved by ${(lastWeekRate - previousWeekRate).toFixed(0)}% this week compared to last week!`,
          data: {
            lastWeekRate,
            previousWeekRate,
            improvement: lastWeekRate - previousWeekRate,
          },
          actionable: false,
        });
      } else if (lastWeekRate < previousWeekRate - 10) {
        insights.push({
          type: 'trend',
          title: 'Declining Trend',
          description: `Your completion rate dropped by ${(previousWeekRate - lastWeekRate).toFixed(0)}% this week. Time to refocus!`,
          data: {
            lastWeekRate,
            previousWeekRate,
            decline: previousWeekRate - lastWeekRate,
          },
          actionable: true,
        });
      }

      // Streak insights
      if (monthlyInsights.overview.currentStreak >= 7) {
        insights.push({
          type: 'streak',
          title: 'Amazing Streak!',
          description: `You're on a ${monthlyInsights.overview.currentStreak}-day streak! Keep the momentum going!`,
          data: {
            currentStreak: monthlyInsights.overview.currentStreak,
          },
          actionable: false,
        });
      }

      // Pattern insights
      if (patterns.length > 0) {
        const bestPattern = patterns.sort((a, b) => {
          const maxA = Math.max(...a.completionByDay.map((d) => d.rate));
          const maxB = Math.max(...b.completionByDay.map((d) => d.rate));
          return maxB - maxA;
        })[0];

        insights.push({
          type: 'milestone',
          title: 'Best Performance Day',
          description: `You complete "${bestPattern.title}" most consistently on ${bestPattern.bestDay}s!`,
          data: bestPattern,
          actionable: false,
        });
      }

      return insights;
    } catch (error: any) {
      logger.error('Get productivity insights error:', error);
      throw error;
    }
  }

  async getDailyProgress(userId: string, targetDate?: Date): Promise<DailyProgress> {
    try {
      const user = await User.findById(userId).select('timezone');
      const timezone = user?.timezone || 'UTC';

      const today = targetDate || DateUtil.getUserTimezoneDate(new Date(), timezone);
      const startOfDay = DateUtil.startOfDayInTimezone(today, timezone);
      const endOfDay = DateUtil.endOfDayInTimezone(today, timezone);

      // Previous day for comparison
      const previousDay = DateUtil.addDaysInTimezone(today, -1, timezone);
      const startOfPreviousDay = DateUtil.startOfDayInTimezone(previousDay, timezone);
      const endOfPreviousDay = DateUtil.endOfDayInTimezone(previousDay, timezone);

      const habits = await Habit.find({
        userId: new Types.ObjectId(userId),
        isActive: true,
      }).lean();

      const habitIds = habits.map((h) => h._id);

      // Get today's logs
      const todayLogs = await HabitLog.find({
        habitId: { $in: habitIds },
        userId: new Types.ObjectId(userId),
        completedAt: { $gte: startOfDay, $lte: endOfDay },
      }).lean();

      // Get previous day's logs for comparison
      const previousDayLogs = await HabitLog.find({
        habitId: { $in: habitIds },
        userId: new Types.ObjectId(userId),
        completedAt: { $gte: startOfPreviousDay, $lte: endOfPreviousDay },
      }).lean();

      // Calculate summary
      const completedHabits = todayLogs.length;
      const totalHabits = habits.length;
      const completionRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

      const moodSum = todayLogs.reduce((sum, log) => sum + (log.mood || 0), 0);
      const moodCount = todayLogs.filter((log) => log.mood).length;
      const averageMood = moodCount > 0 ? moodSum / moodCount : 0;

      const userStreak = await this.calculateOverallStreak(userId);

      // Habits detail with completion status
      const habitsDetail = await Promise.all(
        habits.map(async (habit) => {
          const log = todayLogs.find((l) => l.habitId.toString() === habit._id.toString());
          const streakInfo = await this.calculateHabitStreak(habit._id.toString(), userId);

          return {
            habitId: habit._id.toString(),
            title: habit.title,
            category: habit.category,
            completed: !!log,
            completedAt: log?.completedAt,
            mood: log?.mood,
            note: log?.note,
            streak: streakInfo.current,
            icon: habit.icon,
            color: habit.color,
          };
        })
      );

      // Hourly breakdown
      const hourlyBreakdown: Array<{ hour: number; completed: number }> = [];
      for (let hour = 0; hour < 24; hour++) {
        const completedInHour = todayLogs.filter((log) => log.completedAt.getHours() === hour).length;
        hourlyBreakdown.push({ hour, completed: completedInHour });
      }

      // Previous day comparison
      const previousDayCompletionRate = totalHabits > 0 ? (previousDayLogs.length / totalHabits) * 100 : 0;

      // Upcoming reminders (for today only if targetDate is today)
      const upcomingReminders: Array<{
        habitId: string;
        title: string;
        reminderTime: string;
      }> = [];

      const isTargetToday = DateUtil.isToday(today, timezone);
      if (isTargetToday) {
        const currentHour = new Date().getHours();
        for (const habit of habits) {
          if (habit.reminderTime) {
            const [hour, minute] = habit.reminderTime.split(':').map(Number);
            if (hour > currentHour || (hour === currentHour && minute >= new Date().getMinutes())) {
              upcomingReminders.push({
                habitId: habit._id.toString(),
                title: habit.title,
                reminderTime: habit.reminderTime,
              });
            }
          }
        }
        upcomingReminders.sort((a, b) => a.reminderTime.localeCompare(b.reminderTime));
      }

      return {
        date: today.toISOString().split('T')[0],
        summary: {
          totalHabits,
          completedHabits,
          completionRate,
          averageMood,
          currentStreak: userStreak.current,
        },
        habits: habitsDetail,
        hourlyBreakdown,
        comparison: {
          previousDay: {
            date: previousDay.toISOString().split('T')[0],
            completionRate: previousDayCompletionRate,
            completed: previousDayLogs.length,
          },
          change: {
            rate: completionRate - previousDayCompletionRate,
            completed: completedHabits - previousDayLogs.length,
          },
        },
        upcomingReminders,
      };
    } catch (error: any) {
      logger.error('Get daily progress error:', error);
      throw error;
    }
  }

  private calculateDailyStats(
    start: Date,
    end: Date,
    logs: any[],
    totalHabits: number,
    timezone: string
  ): DailyStats[] {
    const dailyStats: DailyStats[] = [];
    let currentDate = start;

    while (currentDate <= end) {
      const dayLogs = logs.filter(
        (log) => log.completedAt.toDateString() === currentDate.toDateString()
      );

      const moodSum = dayLogs.reduce((sum, log) => sum + (log.mood || 0), 0);
      const moodCount = dayLogs.filter((log) => log.mood).length;

      dailyStats.push({
        date: currentDate.toISOString().split('T')[0],
        completed: dayLogs.length,
        total: totalHabits,
        rate: totalHabits > 0 ? (dayLogs.length / totalHabits) * 100 : 0,
        mood: moodCount > 0 ? moodSum / moodCount : undefined,
      });

      currentDate = DateUtil.addDaysInTimezone(currentDate, 1, timezone);
    }

    return dailyStats;
  }

  private calculateWeeklyTrends(
    dailyTrends: Array<{ date: string; completed: number; rate: number }>,
    timezone: string
  ): Array<{ week: string; completed: number; rate: number }> {
    const weeklyMap = new Map<string, { completed: number; count: number }>();

    for (const daily of dailyTrends) {
      const date = new Date(daily.date);
      const weekStart = DateUtil.startOfWeekInTimezone(date, timezone);
      const weekKey = weekStart.toISOString().split('T')[0];

      const existing = weeklyMap.get(weekKey) || { completed: 0, count: 0 };
      existing.completed += daily.completed;
      existing.count += 1;
      weeklyMap.set(weekKey, existing);
    }

    return Array.from(weeklyMap.entries()).map(([week, data]) => ({
      week,
      completed: data.completed,
      rate: data.count > 0 ? (data.completed / (data.count * 7)) * 100 : 0,
    }));
  }

  private async calculateHabitStreak(habitId: string, userId: string): Promise<{
    current: number;
    longest: number;
  }> {
    const logs = await HabitLog.find({
      habitId: new Types.ObjectId(habitId),
      userId: new Types.ObjectId(userId),
    })
      .sort({ completedAt: -1 })
      .limit(365)
      .lean();

    const dates = logs.map((log) => log.completedAt.toDateString());

    let currentStreak = 0;
    const today = new Date().toDateString();

    if (dates.includes(today)) {
      currentStreak = 1;
      let checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - 1);

      while (dates.includes(checkDate.toDateString())) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: string | null = null;

    for (const date of dates.sort()) {
      if (lastDate) {
        const last = new Date(lastDate);
        const current = new Date(date);
        const diffDays = (current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }

      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }

      lastDate = date;
    }

    return { current: currentStreak, longest: longestStreak };
  }

  private async calculateOverallStreak(userId: string): Promise<{
    current: number;
    longest: number;
  }> {
    const logs = await HabitLog.find({
      userId: new Types.ObjectId(userId),
    })
      .sort({ completedAt: -1 })
      .limit(365)
      .lean();

    const uniqueDates = new Set(logs.map((log) => log.completedAt.toDateString()));
    const dates = Array.from(uniqueDates).sort();

    let currentStreak = 0;
    const today = new Date().toDateString();

    if (uniqueDates.has(today)) {
      currentStreak = 1;
      let checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - 1);

      while (uniqueDates.has(checkDate.toDateString())) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: string | null = null;

    for (const date of dates) {
      if (lastDate) {
        const last = new Date(lastDate);
        const current = new Date(date);
        const diffDays = (current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }

      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }

      lastDate = date;
    }

    return { current: currentStreak, longest: longestStreak };
  }
}

export default new AnalyticsService();
