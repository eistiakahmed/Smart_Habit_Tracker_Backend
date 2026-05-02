import { Response } from 'express';
import analyticsService from '@/services/analytics.service';
import { AuthenticatedRequest } from '@/types';
import logger from '@/utils/logger';
import ResponseUtil from '@/utils/response';

class AnalyticsController {
  async getWeeklyReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const report = await analyticsService.getWeeklyReport(req.user!.id, startDate, endDate);
      ResponseUtil.success(res, report);
    } catch (error: any) {
      logger.error('Get weekly report error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch weekly report');
    }
  }

  async getMonthlyInsights(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const insights = await analyticsService.getMonthlyInsights(req.user!.id);
      ResponseUtil.success(res, insights);
    } catch (error: any) {
      logger.error('Get monthly insights error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch monthly insights');
    }
  }

  async getHabitPatterns(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const patterns = await analyticsService.getHabitPatterns(req.user!.id);
      ResponseUtil.success(res, { patterns });
    } catch (error: any) {
      logger.error('Get habit patterns error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch habit patterns');
    }
  }

  async getProductivityInsights(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const insights = await analyticsService.getProductivityInsights(req.user!.id);
      ResponseUtil.success(res, { insights });
    } catch (error: any) {
      logger.error('Get productivity insights error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch productivity insights');
    }
  }
}

export default new AnalyticsController();
