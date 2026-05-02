"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const Habit_1 = __importDefault(require("@/models/Habit"));
const HabitLog_1 = __importDefault(require("@/models/HabitLog"));
const User_1 = __importDefault(require("@/models/User"));
const date_1 = __importDefault(require("@/utils/date"));
const logger_1 = __importDefault(require("@/utils/logger"));
class HabitService {
    async getAllHabits(userId, filter) {
        try {
            const where = { userId: new mongoose_1.Types.ObjectId(userId) };
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
                Habit_1.default.find(where)
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 })
                    .lean(),
                Habit_1.default.countDocuments(where),
            ]);
            const habitsWithStats = await Promise.all(habits.map(async (habit) => {
                const stats = await this.getHabitStats(habit._id.toString(), userId);
                const todayCompleted = await this.isCompletedToday(habit._id.toString(), userId);
                return {
                    ...habit,
                    id: habit._id.toString(),
                    userId: habit.userId?.toString() || userId,
                    frequency: habit.frequency,
                    difficulty: habit.difficulty,
                    stats,
                    todayCompleted,
                };
            }));
            return {
                habits: habitsWithStats,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            logger_1.default.error('Get habits error:', error);
            throw error;
        }
    }
    async getHabitById(habitId, userId) {
        try {
            const habit = await Habit_1.default.findOne({
                _id: new mongoose_1.Types.ObjectId(habitId),
                userId: new mongoose_1.Types.ObjectId(userId),
            }).lean();
            if (!habit) {
                throw new Error('Habit not found');
            }
            const stats = await this.getHabitStats(habitId, userId);
            const recentLogs = await HabitLog_1.default.find({ habitId: new mongoose_1.Types.ObjectId(habitId) })
                .sort({ completedAt: -1 })
                .limit(7)
                .lean();
            return {
                ...habit,
                id: habit._id.toString(),
                userId: habit.userId?.toString() || userId,
                frequency: habit.frequency,
                difficulty: habit.difficulty,
                stats,
                recentLogs,
            };
        }
        catch (error) {
            logger_1.default.error('Get habit error:', error);
            throw error;
        }
    }
    async createHabit(userId, data) {
        try {
            const activeHabitsCount = await Habit_1.default.countDocuments({
                userId: new mongoose_1.Types.ObjectId(userId),
                isActive: true,
            });
            if (activeHabitsCount >= 20) {
                throw new Error('Maximum active habits limit reached (20)');
            }
            const habit = await Habit_1.default.create({
                userId: new mongoose_1.Types.ObjectId(userId),
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
            logger_1.default.info(`Habit created: ${habit._id} by user ${userId}`);
            return {
                ...habit.toObject(),
                id: habit._id.toString(),
            };
        }
        catch (error) {
            logger_1.default.error('Create habit error:', error);
            throw error;
        }
    }
    async updateHabit(habitId, userId, data) {
        try {
            const habit = await Habit_1.default.findOneAndUpdate({
                _id: new mongoose_1.Types.ObjectId(habitId),
                userId: new mongoose_1.Types.ObjectId(userId),
            }, { $set: data }, { new: true, runValidators: true });
            if (!habit) {
                throw new Error('Habit not found');
            }
            logger_1.default.info(`Habit updated: ${habitId}`);
            return {
                ...habit.toObject(),
                id: habit._id.toString(),
            };
        }
        catch (error) {
            logger_1.default.error('Update habit error:', error);
            throw error;
        }
    }
    async deleteHabit(habitId, userId) {
        try {
            const habit = await Habit_1.default.findOne({
                _id: new mongoose_1.Types.ObjectId(habitId),
                userId: new mongoose_1.Types.ObjectId(userId),
            });
            if (!habit) {
                throw new Error('Habit not found');
            }
            await Habit_1.default.findByIdAndUpdate(habitId, { isActive: false });
            logger_1.default.info(`Habit deleted: ${habitId}`);
        }
        catch (error) {
            logger_1.default.error('Delete habit error:', error);
            throw error;
        }
    }
    async toggleHabit(habitId, userId, data) {
        try {
            const habit = await Habit_1.default.findOne({
                _id: new mongoose_1.Types.ObjectId(habitId),
                userId: new mongoose_1.Types.ObjectId(userId),
            });
            if (!habit) {
                throw new Error('Habit not found');
            }
            if (!habit.isActive) {
                throw new Error('Habit is not active');
            }
            const user = await User_1.default.findById(userId).select('timezone');
            const timezone = user?.timezone || 'UTC';
            const today = date_1.default.startOfDayInTimezone(new Date(), timezone);
            const endOfDay = date_1.default.endOfDayInTimezone(new Date(), timezone);
            const existingLog = await HabitLog_1.default.findOne({
                habitId: new mongoose_1.Types.ObjectId(habitId),
                userId: new mongoose_1.Types.ObjectId(userId),
                completedAt: {
                    $gte: today,
                    $lte: endOfDay,
                },
            });
            if (existingLog) {
                await HabitLog_1.default.deleteOne({ _id: existingLog._id });
                logger_1.default.info(`Habit unmarked: ${habitId} by user ${userId}`);
                return {
                    log: null,
                    streak: await this.getCurrentStreak(habitId, userId, timezone),
                    todayCompleted: false,
                };
            }
            const log = await HabitLog_1.default.create({
                habitId: new mongoose_1.Types.ObjectId(habitId),
                userId: new mongoose_1.Types.ObjectId(userId),
                note: data.note,
                mood: data.mood,
            });
            const streak = await this.getCurrentStreak(habitId, userId, timezone);
            logger_1.default.info(`Habit marked: ${habitId} by user ${userId}`);
            return {
                log: {
                    ...log.toObject(),
                    id: log._id.toString(),
                },
                streak,
                todayCompleted: true,
            };
        }
        catch (error) {
            logger_1.default.error('Toggle habit error:', error);
            throw error;
        }
    }
    async getHabitStats(habitId, userId) {
        try {
            const habit = await Habit_1.default.findById(habitId);
            if (!habit) {
                throw new Error('Habit not found');
            }
            const user = await User_1.default.findById(userId).select('timezone');
            const timezone = user?.timezone || 'UTC';
            const startDate = date_1.default.startOfDayInTimezone(habit.startDate, timezone);
            const endDate = date_1.default.endOfDayInTimezone(new Date(), timezone);
            const logs = await HabitLog_1.default.find({
                habitId: new mongoose_1.Types.ObjectId(habitId),
                userId: new mongoose_1.Types.ObjectId(userId),
                completedAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
            })
                .sort({ completedAt: 1 })
                .lean();
            const completedDates = logs.map((log) => log.completedAt);
            const totalDays = date_1.default.getDaysBetween(startDate, endDate);
            const daysCompleted = completedDates.length;
            const streakInfo = date_1.default.getStreakDates(completedDates, timezone);
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
        }
        catch (error) {
            logger_1.default.error('Get habit stats error:', error);
            throw error;
        }
    }
    async getHabitProgress(habitId, userId, startDate, endDate) {
        try {
            const habit = await Habit_1.default.findById(habitId);
            if (!habit) {
                throw new Error('Habit not found');
            }
            const user = await User_1.default.findById(userId).select('timezone');
            const timezone = user?.timezone || 'UTC';
            const periodStart = startDate || date_1.default.startOfMonthInTimezone(new Date(), timezone);
            const periodEnd = endDate || date_1.default.endOfDayInTimezone(new Date(), timezone);
            const logs = await HabitLog_1.default.find({
                habitId: new mongoose_1.Types.ObjectId(habitId),
                userId: new mongoose_1.Types.ObjectId(userId),
                completedAt: {
                    $gte: periodStart,
                    $lte: periodEnd,
                },
            })
                .sort({ completedAt: 1 })
                .lean();
            const totalDays = date_1.default.getDaysBetween(periodStart, periodEnd);
            const completedDates = logs.map((log) => log.completedAt);
            const streakInfo = date_1.default.getStreakDates(completedDates, timezone);
            const dailyProgress = [];
            let currentDate = periodStart;
            while (currentDate <= periodEnd) {
                const isCompleted = completedDates.some((date) => date_1.default.isToday(date, timezone) && date.toDateString() === currentDate.toDateString());
                dailyProgress.push({
                    date: currentDate.toISOString().split('T')[0],
                    completed: isCompleted,
                });
                currentDate = date_1.default.addDaysInTimezone(currentDate, 1, timezone);
            }
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
        }
        catch (error) {
            logger_1.default.error('Get habit progress error:', error);
            throw error;
        }
    }
    async getHabitStreak(habitId, userId) {
        try {
            const habit = await Habit_1.default.findById(habitId);
            if (!habit) {
                throw new Error('Habit not found');
            }
            const user = await User_1.default.findById(userId).select('timezone');
            const timezone = user?.timezone || 'UTC';
            const startDate = date_1.default.startOfDayInTimezone(habit.startDate, timezone);
            const endDate = date_1.default.endOfDayInTimezone(new Date(), timezone);
            const logs = await HabitLog_1.default.find({
                habitId: new mongoose_1.Types.ObjectId(habitId),
                userId: new mongoose_1.Types.ObjectId(userId),
                completedAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
            })
                .sort({ completedAt: 1 })
                .lean();
            const completedDates = logs.map((log) => log.completedAt);
            const streakInfo = date_1.default.getStreakDates(completedDates, timezone);
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
        }
        catch (error) {
            logger_1.default.error('Get habit streak error:', error);
            throw error;
        }
    }
    async isCompletedToday(habitId, userId) {
        const user = await User_1.default.findById(userId).select('timezone');
        const timezone = user?.timezone || 'UTC';
        const today = date_1.default.startOfDayInTimezone(new Date(), timezone);
        const endOfDay = date_1.default.endOfDayInTimezone(new Date(), timezone);
        const log = await HabitLog_1.default.findOne({
            habitId: new mongoose_1.Types.ObjectId(habitId),
            userId: new mongoose_1.Types.ObjectId(userId),
            completedAt: {
                $gte: today,
                $lte: endOfDay,
            },
        });
        return !!log;
    }
    async getCurrentStreak(habitId, userId, timezone) {
        const habit = await Habit_1.default.findById(habitId);
        if (!habit) {
            return 0;
        }
        const startDate = date_1.default.startOfDayInTimezone(habit.startDate, timezone);
        const endDate = date_1.default.endOfDayInTimezone(new Date(), timezone);
        const logs = await HabitLog_1.default.find({
            habitId: new mongoose_1.Types.ObjectId(habitId),
            userId: new mongoose_1.Types.ObjectId(userId),
            completedAt: {
                $gte: startDate,
                $lte: endDate,
            },
        })
            .sort({ completedAt: 1 })
            .lean();
        const completedDates = logs.map((log) => log.completedAt);
        const streakInfo = date_1.default.getStreakDates(completedDates, timezone);
        return streakInfo.currentStreak;
    }
    calculateWeeklySummary(completedDates, startDate, endDate, timezone) {
        const weeks = [];
        let weekStart = date_1.default.startOfWeekInTimezone(startDate, timezone);
        let weekEnd = date_1.default.endOfWeekInTimezone(startDate, timezone);
        while (weekStart <= endDate) {
            const weekLogs = completedDates.filter((date) => date >= weekStart && date <= weekEnd);
            const totalDays = date_1.default.getDaysBetween(weekStart, weekEnd);
            const completed = weekLogs.length;
            const rate = totalDays > 0 ? (completed / totalDays) * 100 : 0;
            weeks.push({
                weekStart: weekStart.toISOString().split('T')[0],
                weekEnd: weekEnd.toISOString().split('T')[0],
                completed,
                total: totalDays,
                rate: Math.round(rate),
            });
            weekStart = date_1.default.addDaysInTimezone(weekEnd, 1, timezone);
            weekEnd = date_1.default.endOfWeekInTimezone(weekStart, timezone);
        }
        return weeks;
    }
}
exports.default = new HabitService();
//# sourceMappingURL=habit.service.js.map