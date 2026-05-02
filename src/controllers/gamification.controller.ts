import { Response } from 'express';
import gamificationService from '@/services/gamification.service';
import achievementService from '@/services/achievement.service';
import challengeService from '@/services/challenge.service';
import { AuthenticatedRequest } from '@/types';
import logger from '@/utils/logger';
import ResponseUtil from '@/utils/response';

class GamificationController {
  // User stats
  async getUserGamificationStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await gamificationService.getUserGamificationStats(req.user!.id);
      ResponseUtil.success(res, stats);
    } catch (error: any) {
      logger.error('Get gamification stats error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch gamification stats');
    }
  }

  async getUserRank(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const rank = await gamificationService.getUserRank(req.user!.id);
      ResponseUtil.success(res, rank);
    } catch (error: any) {
      logger.error('Get user rank error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch user rank');
    }
  }

  // Leaderboard
  async getLeaderboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const period = (req.query.period as string) || 'all';

      const leaderboard = await gamificationService.getLeaderboard({ limit, period: period as any });
      ResponseUtil.success(res, { leaderboard });
    } catch (error: any) {
      logger.error('Get leaderboard error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch leaderboard');
    }
  }

  // Streak freeze
  async useStreakFreeze(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { habitId } = req.body;

      if (!habitId) {
        ResponseUtil.badRequest(res, 'Habit ID is required');
        return;
      }

      const result = await gamificationService.useStreakFreeze(req.user!.id, habitId);

      if (!result) {
        ResponseUtil.badRequest(res, 'No streak freezes available or streak not broken');
        return;
      }

      ResponseUtil.success(res, { success: true }, 'Streak freeze used successfully');
    } catch (error: any) {
      logger.error('Use streak freeze error:', error);
      ResponseUtil.serverError(res, 'Failed to use streak freeze');
    }
  }

  // Achievements
  async getAllAchievements(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const achievements = await achievementService.getAllAchievements();
      ResponseUtil.success(res, { achievements });
    } catch (error: any) {
      logger.error('Get achievements error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch achievements');
    }
  }

  async getUserAchievements(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userAchievements = await achievementService.getUserAchievements(req.user!.id);
      ResponseUtil.success(res, userAchievements);
    } catch (error: any) {
      logger.error('Get user achievements error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch user achievements');
    }
  }

  async checkAchievements(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await achievementService.checkAndUnlockAchievements(req.user!.id);
      ResponseUtil.success(res, result);
    } catch (error: any) {
      logger.error('Check achievements error:', error);
      ResponseUtil.serverError(res, 'Failed to check achievements');
    }
  }

  // Daily Challenges
  async getActiveChallenges(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const challenges = await challengeService.getActiveChallenges(req.user!.id);
      ResponseUtil.success(res, { challenges });
    } catch (error: any) {
      logger.error('Get active challenges error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch active challenges');
    }
  }

  async joinChallenge(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { challengeId } = req.params;
      const challenge = await challengeService.joinChallenge(challengeId, req.user!.id);
      ResponseUtil.success(res, { challenge }, 'Challenge joined successfully');
    } catch (error: any) {
      logger.error('Join challenge error:', error);

      if (error.message === 'Challenge not found' || error.message === 'Challenge is not active' || error.message === 'Already participating in this challenge') {
        ResponseUtil.badRequest(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to join challenge');
    }
  }

  async updateChallengeProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { challengeId } = req.params;
      const result = await challengeService.updateChallengeProgress(challengeId, req.user!.id);
      ResponseUtil.success(res, result);
    } catch (error: any) {
      logger.error('Update challenge progress error:', error);
      ResponseUtil.serverError(res, 'Failed to update challenge progress');
    }
  }

  async getUserChallenges(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const challenges = await challengeService.getUserChallenges(req.user!.id);
      ResponseUtil.success(res, challenges);
    } catch (error: any) {
      logger.error('Get user challenges error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch user challenges');
    }
  }
}

export default new GamificationController();
