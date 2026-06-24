import { Response } from 'express';
import { AuthenticatedRequest } from '@/types';
import energySchedulingService from '@/services/energyScheduling.service';
import logger from '@/utils/logger';

class EnergySchedulingController {
  private energySchedulingService = energySchedulingService;

  // Log energy
  logEnergy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const energyData = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const log = await this.energySchedulingService.logEnergy(userId, energyData);

      res.status(201).json({
        success: true,
        data: log,
      });
    } catch (error: any) {
      logger.error('Error logging energy:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to log energy' },
      });
    }
  };

  // Log energy from habit completion
  logEnergyFromHabit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { habitId } = req.params;
      const completionData = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const log = await this.energySchedulingService.logEnergyFromHabit(userId, habitId, completionData);

      res.status(201).json({
        success: true,
        data: log,
      });
    } catch (error: any) {
      logger.error('Error logging energy from habit:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to log energy from habit' },
      });
    }
  };

  // Get today's energy logs
  getTodayEnergyLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const logs = await this.energySchedulingService.getTodayEnergyLogs(userId);

      res.status(200).json({
        success: true,
        data: { logs },
      });
    } catch (error: any) {
      logger.error('Error getting today energy logs:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get today energy logs' },
      });
    }
  };

  // Get energy patterns
  getEnergyPatterns = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const patterns = await this.energySchedulingService.getEnergyPatterns(userId);

      res.status(200).json({
        success: true,
        data: { patterns },
      });
    } catch (error: any) {
      logger.error('Error getting energy patterns:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get energy patterns' },
      });
    }
  };

  // Analyze energy patterns
  analyzeEnergyPatterns = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const analysis = await this.energySchedulingService.analyzeEnergyPatterns(userId);

      res.status(200).json({
        success: true,
        data: analysis,
      });
    } catch (error: any) {
      logger.error('Error analyzing energy patterns:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to analyze energy patterns' },
      });
    }
  };

  // Get current energy level
  getCurrentEnergyLevel = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const current = await this.energySchedulingService.getCurrentEnergyLevel(userId);

      res.status(200).json({
        success: true,
        data: current,
      });
    } catch (error: any) {
      logger.error('Error getting current energy level:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get current energy level' },
      });
    }
  };

  // Generate schedule recommendations
  generateScheduleRecommendations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

      const recommendations = await this.energySchedulingService.generateScheduleRecommendations(userId, habitId);

      res.status(200).json({
        success: true,
        data: recommendations,
      });
    } catch (error: any) {
      logger.error('Error generating schedule recommendations:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to generate schedule recommendations' },
      });
    }
  };

  // Get optimal schedule
  getOptimalSchedule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const schedule = await this.energySchedulingService.getOptimalSchedule(userId);

      res.status(200).json({
        success: true,
        data: schedule,
      });
    } catch (error: any) {
      logger.error('Error getting optimal schedule:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get optimal schedule' },
      });
    }
  };

  // Create energy goal
  createEnergyGoal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const goalData = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const goal = await this.energySchedulingService.createEnergyGoal(userId, goalData);

      res.status(201).json({
        success: true,
        data: goal,
      });
    } catch (error: any) {
      logger.error('Error creating energy goal:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to create energy goal' },
      });
    }
  };

  // Get energy goals
  getEnergyGoals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const goals = await this.energySchedulingService.getEnergyGoals(userId);

      res.status(200).json({
        success: true,
        data: { goals },
      });
    } catch (error: any) {
      logger.error('Error getting energy goals:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get energy goals' },
      });
    }
  };

  // Get energy insights
  getEnergyInsights = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const insights = await this.energySchedulingService.getEnergyInsights(userId);

      res.status(200).json({
        success: true,
        data: insights,
      });
    } catch (error: any) {
      logger.error('Error getting energy insights:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get energy insights' },
      });
    }
  };
}

export default new EnergySchedulingController();
