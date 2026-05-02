import { Response } from 'express';
import goalService from '@/services/goal.service';
import { AuthenticatedRequest } from '@/types';
import logger from '@/utils/logger';
import ResponseUtil from '@/utils/response';

class GoalController {
  async getAllGoals(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filter = {
        status: req.query.status as string | undefined,
        category: req.query.category as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const result = await goalService.getAllGoals(req.user!.id, filter);
      ResponseUtil.success(res, result);
    } catch (error: any) {
      logger.error('Get goals controller error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch goals');
    }
  }

  async getGoalById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const goal = await goalService.getGoalById(req.params.id, req.user!.id);
      ResponseUtil.success(res, { goal });
    } catch (error: any) {
      logger.error('Get goal controller error:', error);

      if (error.message === 'Goal not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to fetch goal');
    }
  }

  async createGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const goal = await goalService.createGoal(req.user!.id, req.body);
      ResponseUtil.created(res, { goal }, 'Goal created successfully');
    } catch (error: any) {
      logger.error('Create goal controller error:', error);
      ResponseUtil.serverError(res, 'Failed to create goal');
    }
  }

  async updateGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const goal = await goalService.updateGoal(req.params.id, req.user!.id, req.body);
      ResponseUtil.success(res, { goal }, 'Goal updated successfully');
    } catch (error: any) {
      logger.error('Update goal controller error:', error);

      if (error.message === 'Goal not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to update goal');
    }
  }

  async updateGoalProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { value } = req.body;

      if (typeof value !== 'number' || value < 0) {
        ResponseUtil.badRequest(res, 'Invalid progress value');
        return;
      }

      const goal = await goalService.updateGoalProgress(req.params.id, req.user!.id, value);
      ResponseUtil.success(res, { goal }, 'Goal progress updated successfully');
    } catch (error: any) {
      logger.error('Update goal progress controller error:', error);

      if (error.message === 'Goal not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to update goal progress');
    }
  }

  async deleteGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await goalService.deleteGoal(req.params.id, req.user!.id);
      ResponseUtil.success(res, null, 'Goal deleted successfully');
    } catch (error: any) {
      logger.error('Delete goal controller error:', error);

      if (error.message === 'Goal not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to delete goal');
    }
  }

  async getGoalProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const progress = await goalService.getGoalProgress(req.params.id, req.user!.id);
      ResponseUtil.success(res, progress);
    } catch (error: any) {
      logger.error('Get goal progress controller error:', error);

      if (error.message === 'Goal not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to fetch goal progress');
    }
  }

  async getGoalStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await goalService.getGoalStats(req.user!.id);
      ResponseUtil.success(res, stats);
    } catch (error: any) {
      logger.error('Get goal stats controller error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch goal statistics');
    }
  }
}

export default new GoalController();
