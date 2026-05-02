import { Response } from 'express';
import habitService from '@/services/habit.service';
import { AuthenticatedRequest } from '@/types';
import logger from '@/utils/logger';
import ResponseUtil from '@/utils/response';

class HabitController {
  async getAllHabits(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filter = {
        category: req.query.category as string | undefined,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const result = await habitService.getAllHabits(req.user!.id, filter);
      ResponseUtil.success(res, result);
    } catch (error: any) {
      logger.error('Get habits controller error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch habits');
    }
  }

  async getHabitById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const habit = await habitService.getHabitById(req.params.id, req.user!.id);
      ResponseUtil.success(res, { habit });
    } catch (error: any) {
      logger.error('Get habit controller error:', error);

      if (error.message === 'Habit not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to fetch habit');
    }
  }

  async createHabit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const habit = await habitService.createHabit(req.user!.id, req.body);
      ResponseUtil.created(res, { habit }, 'Habit created successfully');
    } catch (error: any) {
      logger.error('Create habit controller error:', error);

      if (error.message.includes('limit reached')) {
        ResponseUtil.badRequest(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to create habit');
    }
  }

  async updateHabit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const habit = await habitService.updateHabit(req.params.id, req.user!.id, req.body);
      ResponseUtil.success(res, { habit }, 'Habit updated successfully');
    } catch (error: any) {
      logger.error('Update habit controller error:', error);

      if (error.message === 'Habit not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to update habit');
    }
  }

  async deleteHabit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await habitService.deleteHabit(req.params.id, req.user!.id);
      ResponseUtil.success(res, null, 'Habit deleted successfully');
    } catch (error: any) {
      logger.error('Delete habit controller error:', error);

      if (error.message === 'Habit not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to delete habit');
    }
  }

  async toggleHabit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await habitService.toggleHabit(req.params.id, req.user!.id, req.body);

      if (result.todayCompleted) {
        ResponseUtil.success(res, result, 'Habit marked as completed');
      } else {
        ResponseUtil.success(res, result, 'Habit marked as incomplete');
      }
    } catch (error: any) {
      logger.error('Toggle habit controller error:', error);

      if (error.message === 'Habit not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      if (error.message === 'Habit is not active') {
        ResponseUtil.badRequest(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to toggle habit');
    }
  }

  async getHabitProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const progress = await habitService.getHabitProgress(req.params.id, req.user!.id, startDate, endDate);
      ResponseUtil.success(res, progress);
    } catch (error: any) {
      logger.error('Get habit progress controller error:', error);

      if (error.message === 'Habit not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to fetch habit progress');
    }
  }

  async getHabitStreak(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const streak = await habitService.getHabitStreak(req.params.id, req.user!.id);
      ResponseUtil.success(res, streak);
    } catch (error: any) {
      logger.error('Get habit streak controller error:', error);

      if (error.message === 'Habit not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to fetch habit streak');
    }
  }
}

export default new HabitController();
