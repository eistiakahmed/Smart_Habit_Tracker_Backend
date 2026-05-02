import { Types } from 'mongoose';
import Goal from '@/models/Goal';
import logger from '@/utils/logger';
import { CreateGoalData, UpdateGoalData, GoalResponse, GoalStatus, GoalFilter, GoalProgress } from '@/types';

class GoalService {
  async getAllGoals(userId: string, filter?: GoalFilter): Promise<{
    goals: GoalResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const where: any = { userId: new Types.ObjectId(userId) };

      if (filter?.status) {
        where.status = filter.status;
      }

      if (filter?.category) {
        where.category = filter.category;
      }

      const page = filter?.page || 1;
      const limit = filter?.limit || 20;
      const skip = (page - 1) * limit;

      const [goals, total] = await Promise.all([
        Goal.find(where)
          .skip(skip)
          .limit(limit)
          .sort({ targetDate: 1 })
          .lean(),
        Goal.countDocuments(where),
      ]);

      const goalsWithProgress = goals.map((goal) => {
        const progress = this.calculateProgress(goal.currentValue, goal.targetValue);
        const daysRemaining = this.calculateDaysRemaining(goal.targetDate);

        return {
          ...goal,
          id: goal._id.toString(),
          userId: goal.userId?.toString() || userId,
          status: goal.status as GoalStatus,
          progress,
          daysRemaining,
        };
      });

      return {
        goals: goalsWithProgress,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Get goals error:', error);
      throw error;
    }
  }

  async getGoalById(goalId: string, userId: string): Promise<GoalResponse> {
    try {
      const goal = await Goal.findOne({
        _id: new Types.ObjectId(goalId),
        userId: new Types.ObjectId(userId),
      }).lean();

      if (!goal) {
        throw new Error('Goal not found');
      }

      const progress = this.calculateProgress(goal.currentValue, goal.targetValue);
      const daysRemaining = this.calculateDaysRemaining(goal.targetDate);

      return {
        ...goal,
        id: goal._id.toString(),
        userId: goal.userId?.toString() || userId,
        status: goal.status as GoalStatus,
        progress,
        daysRemaining,
      };
    } catch (error: any) {
      logger.error('Get goal error:', error);
      throw error;
    }
  }

  async createGoal(userId: string, data: CreateGoalData): Promise<GoalResponse> {
    try {
      const goal = await Goal.create({
        userId: new Types.ObjectId(userId),
        title: data.title,
        description: data.description,
        targetValue: data.targetValue,
        currentValue: 0,
        unit: data.unit,
        startDate: new Date(),
        targetDate: new Date(data.targetDate),
        status: 'ACTIVE',
        category: data.category,
      });

      logger.info(`Goal created: ${goal._id} by user ${userId}`);

      const progress = this.calculateProgress(goal.currentValue, goal.targetValue);
      const daysRemaining = this.calculateDaysRemaining(goal.targetDate);

      return {
        ...goal.toObject(),
        id: goal._id.toString(),
        status: goal.status as GoalStatus,
        progress,
        daysRemaining,
      };
    } catch (error: any) {
      logger.error('Create goal error:', error);
      throw error;
    }
  }

  async updateGoal(goalId: string, userId: string, data: UpdateGoalData): Promise<GoalResponse> {
    try {
      const updateData: any = { ...data };

      const goal = await Goal.findOneAndUpdate(
        {
          _id: new Types.ObjectId(goalId),
          userId: new Types.ObjectId(userId),
        },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!goal) {
        throw new Error('Goal not found');
      }

      // Auto-update status based on progress
      if (data.currentValue !== undefined || data.targetValue !== undefined) {
        const progress = this.calculateProgress(goal.currentValue, goal.targetValue);
        if (progress >= 100 && goal.status === 'ACTIVE') {
          goal.status = 'COMPLETED';
          await goal.save();
          logger.info(`Goal auto-completed: ${goalId}`);
        }
      }

      logger.info(`Goal updated: ${goalId}`);

      const finalProgress = this.calculateProgress(goal.currentValue, goal.targetValue);
      const daysRemaining = this.calculateDaysRemaining(goal.targetDate);

      return {
        ...goal.toObject(),
        id: goal._id.toString(),
        status: goal.status as GoalStatus,
        progress: finalProgress,
        daysRemaining,
      };
    } catch (error: any) {
      logger.error('Update goal error:', error);
      throw error;
    }
  }

  async updateGoalProgress(goalId: string, userId: string, value: number): Promise<GoalResponse> {
    try {
      const goal = await Goal.findOne({
        _id: new Types.ObjectId(goalId),
        userId: new Types.ObjectId(userId),
      });

      if (!goal) {
        throw new Error('Goal not found');
      }

      goal.currentValue = value;

      if (goal.currentValue >= goal.targetValue && goal.status === 'ACTIVE') {
        goal.status = 'COMPLETED';
        logger.info(`Goal completed via progress update: ${goalId}`);
      } else if (goal.currentValue < goal.targetValue && goal.status === 'COMPLETED') {
        goal.status = 'ACTIVE';
      }

      await goal.save();
      logger.info(`Goal progress updated: ${goalId} to ${value}`);

      const progress = this.calculateProgress(goal.currentValue, goal.targetValue);
      const daysRemaining = this.calculateDaysRemaining(goal.targetDate);

      return {
        ...goal.toObject(),
        id: goal._id.toString(),
        status: goal.status as GoalStatus,
        progress,
        daysRemaining,
      };
    } catch (error: any) {
      logger.error('Update goal progress error:', error);
      throw error;
    }
  }

  async deleteGoal(goalId: string, userId: string): Promise<void> {
    try {
      const goal = await Goal.findOne({
        _id: new Types.ObjectId(goalId),
        userId: new Types.ObjectId(userId),
      });

      if (!goal) {
        throw new Error('Goal not found');
      }

      await Goal.findByIdAndDelete(goalId);
      logger.info(`Goal deleted: ${goalId}`);
    } catch (error: any) {
      logger.error('Delete goal error:', error);
      throw error;
    }
  }

  async getGoalProgress(goalId: string, userId: string): Promise<GoalProgress> {
    try {
      const goal = await Goal.findOne({
        _id: new Types.ObjectId(goalId),
        userId: new Types.ObjectId(userId),
      });

      if (!goal) {
        throw new Error('Goal not found');
      }

      const progress = this.calculateProgress(goal.currentValue, goal.targetValue);
      const daysRemaining = this.calculateDaysRemaining(goal.targetDate);
      const daysElapsed = this.calculateDaysElapsed(goal.startDate);

      const dailyTarget = goal.targetValue / Math.max(1, daysElapsed + daysRemaining);
      const expectedValue = dailyTarget * daysElapsed;
      const variance = goal.currentValue - expectedValue;
      const variancePercent = goal.targetValue > 0 ? (variance / goal.targetValue) * 100 : 0;

      return {
        goalId,
        currentValue: goal.currentValue,
        targetValue: goal.targetValue,
        progress,
        daysRemaining,
        daysElapsed,
        onTrack: variance >= 0,
        variance: {
          absolute: variance,
          percent: variancePercent,
        },
        status: goal.status as GoalStatus,
        milestones: this.calculateMilestones(goal.currentValue, goal.targetValue),
      };
    } catch (error: any) {
      logger.error('Get goal progress error:', error);
      throw error;
    }
  }

  async getGoalStats(userId: string): Promise<{
    total: number;
    active: number;
    completed: number;
    failed: number;
    paused: number;
    completionRate: number;
    categoryBreakdown: Array<{ category: string; count: number; completionRate: number }>;
  }> {
    try {
      const goals = await Goal.find({ userId: new Types.ObjectId(userId) }).lean();

      const total = goals.length;
      const active = goals.filter((g) => g.status === 'ACTIVE').length;
      const completed = goals.filter((g) => g.status === 'COMPLETED').length;
      const failed = goals.filter((g) => g.status === 'FAILED').length;
      const paused = goals.filter((g) => g.status === 'PAUSED').length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      const categoryMap = new Map<string, { count: number; completed: number }>();

      for (const goal of goals) {
        const existing = categoryMap.get(goal.category) || { count: 0, completed: 0 };
        existing.count++;
        if (goal.status === 'COMPLETED') {
          existing.completed++;
        }
        categoryMap.set(goal.category, existing);
      }

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        completionRate: data.count > 0 ? (data.completed / data.count) * 100 : 0,
      }));

      return {
        total,
        active,
        completed,
        failed,
        paused,
        completionRate,
        categoryBreakdown,
      };
    } catch (error: any) {
      logger.error('Get goal stats error:', error);
      throw error;
    }
  }

  private calculateProgress(currentValue: number, targetValue: number): number {
    if (targetValue <= 0) return 0;
    return Math.min(100, Math.max(0, (currentValue / targetValue) * 100));
  }

  private calculateDaysRemaining(targetDate: Date): number {
    const now = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  private calculateDaysElapsed(startDate: Date): number {
    const now = new Date();
    const start = new Date(startDate);
    const diffTime = now.getTime() - start.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  private calculateMilestones(currentValue: number, targetValue: number): Array<{
    percent: number;
    value: number;
    achieved: boolean;
    achievedAt?: Date;
  }> {
    const milestones = [25, 50, 75, 100];
    return milestones.map((percent) => {
      const value = (targetValue * percent) / 100;
      const achieved = currentValue >= value;
      return {
        percent,
        value,
        achieved,
      };
    });
  }
}

export default new GoalService();
