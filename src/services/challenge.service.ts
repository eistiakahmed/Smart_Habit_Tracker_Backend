import { Types } from 'mongoose';
import { DailyChallenge, User, Habit, HabitLog } from '@/models';
import gamificationService from './gamification.service';
import logger from '@/utils/logger';

class ChallengeService {
  predefinedChallenges() {
    return [
      {
        title: 'Week Warrior',
        description: 'Complete at least one habit every day for 7 days',
        type: 'HABIT_STREAK' as const,
        requirement: { type: 'daily_streak', value: 7 },
        reward: { points: 100, xp: 50 },
        durationDays: 7,
      },
      {
        title: 'Perfect Week',
        description: 'Complete ALL your habits for 7 consecutive days',
        type: 'COMPLETE_ALL' as const,
        requirement: { type: 'perfect_days', value: 7 },
        reward: { points: 200, xp: 100 },
        durationDays: 7,
      },
      {
        title: 'Early Bird Challenge',
        description: 'Complete any habit before 7 AM for 5 days',
        type: 'EARLY_BIRD' as const,
        requirement: { type: 'early_completions', value: 5 },
        reward: { points: 75, xp: 35 },
        durationDays: 7,
      },
      {
        title: 'Night Owl Challenge',
        description: 'Complete any habit after 10 PM for 5 days',
        type: 'NIGHT_OWL' as const,
        requirement: { type: 'late_completions', value: 5 },
        reward: { points: 75, xp: 35 },
        durationDays: 7,
      },
      {
        title: 'Health Master',
        description: 'Complete 20 health category habits',
        type: 'CATEGORY_MASTER' as const,
        requirement: { type: 'category_count', category: 'health', value: 20 },
        reward: { points: 150, xp: 75 },
        durationDays: 14,
      },
      {
        title: 'Learning Spree',
        description: 'Complete 15 learning category habits',
        type: 'CATEGORY_MASTER' as const,
        requirement: { type: 'category_count', category: 'learning', value: 15 },
        reward: { points: 125, xp: 60 },
        durationDays: 14,
      },
      {
        title: 'New Habit Explorer',
        description: 'Create and complete 3 new habits',
        type: 'NEW_HABIT' as const,
        requirement: { type: 'new_habits', value: 3 },
        reward: { points: 100, xp: 50 },
        durationDays: 7,
      },
    ];
  }

  async createDailyChallenge(challengeData: {
    title: string;
    description: string;
    type: string;
    requirement: any;
    reward: { points: number; xp: number };
    durationDays: number;
  }): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + (challengeData.durationDays || 7));

      const challenge = await DailyChallenge.create({
        title: challengeData.title,
        description: challengeData.description,
        type: challengeData.type,
        requirement: challengeData.requirement,
        reward: challengeData.reward,
        isActive: true,
        startDate,
        endDate,
        participants: [],
      });

      logger.info(`Daily challenge created: ${challenge._id}`);

      return {
        ...challenge.toObject(),
        id: challenge._id.toString(),
      };
    } catch (error: any) {
      logger.error('Create daily challenge error:', error);
      throw error;
    }
  }

  async getActiveChallenges(userId?: string): Promise<any[]> {
    try {
      const now = new Date();

      const challenges = await DailyChallenge.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
        .sort({ endDate: 1 })
        .lean();

      const challengesWithStatus = await Promise.all(
        challenges.map(async (challenge) => {
          let userProgress = null;
          let isCompleted = false;
          let progress = 0;

          if (userId) {
            const participant = challenge.participants.find(
              (p: any) => p.userId?.toString() === userId
            );

            if (participant) {
              userProgress = participant;
              isCompleted = participant.completed;
              progress = participant.progress;
            } else {
              progress = await this.calculateChallengeProgress(userId, challenge);
            }
          }

          return {
            ...challenge,
            id: challenge._id.toString(),
            participantCount: challenge.participants.length,
            completedCount: challenge.participants.filter((p: any) => p.completed).length,
            userProgress,
            isCompleted,
            progress,
          };
        })
      );

      return challengesWithStatus;
    } catch (error: any) {
      logger.error('Get active challenges error:', error);
      throw error;
    }
  }

  async joinChallenge(challengeId: string, userId: string): Promise<any> {
    try {
      const challenge = await DailyChallenge.findById(challengeId);

      if (!challenge) {
        throw new Error('Challenge not found');
      }

      if (!challenge.isActive) {
        throw new Error('Challenge is not active');
      }

      const now = new Date();
      if (now < challenge.startDate || now > challenge.endDate) {
        throw new Error('Challenge is not currently running');
      }

      const alreadyParticipating = challenge.participants.some(
        (p: any) => p.userId?.toString() === userId
      );

      if (alreadyParticipating) {
        throw new Error('Already participating in this challenge');
      }

      challenge.participants.push({
        userId: new Types.ObjectId(userId),
        completed: false,
        progress: 0,
      });

      await challenge.save();

      logger.info(`User ${userId} joined challenge ${challengeId}`);

      return {
        ...challenge.toObject(),
        id: challenge._id.toString(),
      };
    } catch (error: any) {
      logger.error('Join challenge error:', error);
      throw error;
    }
  }

  async updateChallengeProgress(challengeId: string, userId: string): Promise<{
    completed: boolean;
    progress: number;
    reward?: { points: number; xp: number };
  }> {
    try {
      const challenge = await DailyChallenge.findById(challengeId);

      if (!challenge) {
        throw new Error('Challenge not found');
      }

      const participant = challenge.participants.find(
        (p: any) => p.userId?.toString() === userId
      );

      if (!participant) {
        throw new Error('Not participating in this challenge');
      }

      if (participant.completed) {
        return {
          completed: true,
          progress: 100,
        };
      }

      const progress = await this.calculateChallengeProgress(userId, challenge);
      participant.progress = progress;

      if (progress >= 100) {
        participant.completed = true;
        participant.completedAt = new Date();

        // Award rewards
        await gamificationService.awardPoints(userId, challenge.reward.points, 'Challenge completion');
        await gamificationService.awardXP(userId, challenge.reward.xp);

        logger.info(`User ${userId} completed challenge ${challengeId}`);
      }

      await challenge.save();

      return {
        completed: participant.completed,
        progress: participant.progress,
        reward: participant.completed ? challenge.reward : undefined,
      };
    } catch (error: any) {
      logger.error('Update challenge progress error:', error);
      throw error;
    }
  }

  async getUserChallenges(userId: string): Promise<{
    active: any[];
    completed: any[];
  }> {
    try {
      const challenges = await DailyChallenge.find({
        'participants.userId': new Types.ObjectId(userId),
      }).lean();

      const active: any[] = [];
      const completed: any[] = [];

      for (const challenge of challenges) {
        const participant = challenge.participants.find(
          (p: any) => p.userId?.toString() === userId
        );

        const challengeWithStatus = {
          ...challenge,
          id: challenge._id.toString(),
          userProgress: participant,
        };

        if (participant?.completed) {
          completed.push(challengeWithStatus);
        } else {
          active.push(challengeWithStatus);
        }
      }

      return { active, completed };
    } catch (error: any) {
      logger.error('Get user challenges error:', error);
      throw error;
    }
  }

  private async calculateChallengeProgress(userId: string, challenge: any): Promise<number> {
    const { requirement } = challenge;

    switch (requirement.type) {
      case 'daily_streak': {
        const logs = await HabitLog.find({
          userId: new Types.ObjectId(userId),
        })
          .sort({ completedAt: -1 })
          .limit(100)
          .lean();

        const uniqueDays = new Set(logs.map((log) => log.completedAt.toDateString()));
        const streak = this.getCurrentStreak(Array.from(uniqueDays));
        return Math.min(100, (streak / requirement.value) * 100);
      }

      case 'perfect_days': {
        const habits = await Habit.find({
          userId: new Types.ObjectId(userId),
          isActive: true,
        }).lean();

        const habitIds = habits.map((h) => h._id);

        const logs = await HabitLog.aggregate([
          {
            $match: {
              habitId: { $in: habitIds },
              userId: new Types.ObjectId(userId),
              completedAt: { $gte: challenge.startDate },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$completedAt' },
              },
              uniqueHabits: { $addToSet: '$habitId' },
            },
          },
          {
            $match: {
              'uniqueHabits.3': { $exists: true }, // At least some habits
            },
          },
        ]);

        const perfectDays = logs.filter((log) => {
          return log.uniqueHabits.length >= Math.max(1, Math.floor(habitIds.length * 0.8));
        }).length;

        return Math.min(100, (perfectDays / requirement.value) * 100);
      }

      case 'early_completions': {
        const count = await HabitLog.countDocuments({
          userId: new Types.ObjectId(userId),
          completedAt: {
            $gte: challenge.startDate,
            $lt: new Date(challenge.endDate).setDate(new Date(challenge.endDate).getDate() + 1),
          },
        });

        const earlyCompletions = await HabitLog.aggregate([
          {
            $match: {
              userId: new Types.ObjectId(userId),
              completedAt: { $gte: challenge.startDate },
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
              hour: { $lt: 7 },
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

        return Math.min(100, ((earlyCompletions[0]?.days || 0) / requirement.value) * 100);
      }

      case 'late_completions': {
        const lateCompletions = await HabitLog.aggregate([
          {
            $match: {
              userId: new Types.ObjectId(userId),
              completedAt: { $gte: challenge.startDate },
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
              hour: { $gte: 22 },
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

        return Math.min(100, ((lateCompletions[0]?.days || 0) / requirement.value) * 100);
      }

      case 'category_count': {
        const categoryHabits = await Habit.find({
          userId: new Types.ObjectId(userId),
          category: requirement.category,
        }).distinct('_id');

        const count = await HabitLog.countDocuments({
          habitId: { $in: categoryHabits },
          userId: new Types.ObjectId(userId),
          completedAt: { $gte: challenge.startDate },
        });

        return Math.min(100, (count / requirement.value) * 100);
      }

      case 'new_habits': {
        const newHabits = await Habit.find({
          userId: new Types.ObjectId(userId),
          createdAt: { $gte: challenge.startDate },
        }).lean();

        const habitIds = newHabits.map((h) => h._id);

        const completedNewHabits = await HabitLog.countDocuments({
          habitId: { $in: habitIds },
          userId: new Types.ObjectId(userId),
        });

        return Math.min(100, (completedNewHabits / requirement.value) * 100);
      }

      default:
        return 0;
    }
  }

  private getCurrentStreak(days: string[]): number {
    if (days.length === 0) return 0;

    const sortedDays = days.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    let streak = 0;
    let checkDate = new Date();

    for (let i = 0; i < sortedDays.length; i++) {
      const dateString = checkDate.toDateString();
      if (sortedDays.includes(dateString)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }
}

export default new ChallengeService();
