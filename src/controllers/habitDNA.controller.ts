import { Response } from 'express';
import { AuthenticatedRequest } from '@/types';
import habitDNAService from '@/services/habitDNA.service';
import logger from '@/utils/logger';

class HabitDNAController {

  // Analyze habit genetics
  analyzeHabitGenetics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { habitId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const result = await habitDNAService.analyzeHabitGenetics(habitId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Error analyzing habit genetics:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to analyze habit genetics' },
      });
    }
  };

  // Breed habits
  breedHabits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { parentId1, parentId2 } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const result = await habitDNAService.breedHabits(parentId1, parentId2, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Error breeding habits:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to breed habits' },
      });
    }
  };

  // Get breeding suggestions
  getBreedingSuggestions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { habitId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const suggestions = await habitDNAService.getBreedingSuggestions(habitId, userId);

      res.status(200).json({
        success: true,
        data: { suggestions },
      });
    } catch (error: any) {
      logger.error('Error getting breeding suggestions:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get breeding suggestions' },
      });
    }
  };

  // Mutate habit
  mutateHabit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { habitId } = req.params;
      const { forcedType } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const result = await habitDNAService.mutateHabit(habitId, userId, forcedType);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Error mutating habit:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to mutate habit' },
      });
    }
  };

  // Get genetic insights
  getGeneticInsights = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { habitId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const insights = await habitDNAService.getGeneticInsights(habitId, userId);

      res.status(200).json({
        success: true,
        data: insights,
      });
    } catch (error: any) {
      logger.error('Error getting genetic insights:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get genetic insights' },
      });
    }
  };

  // Get user's habit DNAs
  getUserHabitDNA = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const dnas = await habitDNAService.getUserHabitDNA(userId);

      res.status(200).json({
        success: true,
        data: { dnas },
      });
    } catch (error: any) {
      logger.error('Error getting user habit DNAs:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get user habit DNAs' },
      });
    }
  };
}

export default new HabitDNAController();
