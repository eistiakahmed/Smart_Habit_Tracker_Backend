import { Response } from 'express';
import { AuthenticatedRequest } from '@/types';
import timeMachineService from '@/services/timeMachine.service';
import logger from '@/utils/logger';

class TimeMachineController {
  private timeMachineService = timeMachineService;

  // Create scenario
  createScenario = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const scenarioData = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const scenario = await this.timeMachineService.createScenario(userId, scenarioData);

      res.status(201).json({
        success: true,
        data: scenario,
      });
    } catch (error: any) {
      logger.error('Error creating scenario:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to create scenario' },
      });
    }
  };

  // Run scenario
  runScenario = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { scenarioId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const result = await this.timeMachineService.runScenario(userId, scenarioId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Error running scenario:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to run scenario' },
      });
    }
  };

  // Get user scenarios
  getUserScenarios = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const scenarios = await this.timeMachineService.getUserScenarios(userId);

      res.status(200).json({
        success: true,
        data: { scenarios },
      });
    } catch (error: any) {
      logger.error('Error getting user scenarios:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get user scenarios' },
      });
    }
  };

  // Get specific scenario
  getScenario = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { scenarioId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const scenario = await this.timeMachineService.getScenario(userId, scenarioId);

      res.status(200).json({
        success: true,
        data: { scenario },
      });
    } catch (error: any) {
      logger.error('Error getting scenario:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get scenario' },
      });
    }
  };

  // Predict future performance
  predictFuturePerformance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const timeframe = parseInt(req.query.timeframe as string) || 30;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const prediction = await this.timeMachineService.predictFuturePerformance(userId, timeframe);

      res.status(200).json({
        success: true,
        data: prediction,
      });
    } catch (error: any) {
      logger.error('Error predicting future performance:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to predict future performance' },
      });
    }
  };

  // Create alternative timeline
  createAlternativeTimeline = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { divergenceDate, modifications } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const timeline = await this.timeMachineService.createAlternativeTimeline(userId, divergenceDate, modifications);

      res.status(201).json({
        success: true,
        data: timeline,
      });
    } catch (error: any) {
      logger.error('Error creating alternative timeline:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to create alternative timeline' },
      });
    }
  };

  // Compare strategies
  compareStrategies = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { strategies } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const comparison = await this.timeMachineService.compareStrategies(userId, strategies);

      res.status(200).json({
        success: true,
        data: comparison,
      });
    } catch (error: any) {
      logger.error('Error comparing strategies:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to compare strategies' },
      });
    }
  };

  // Design experiment
  designExperiment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const experimentData = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const experiment = await this.timeMachineService.designExperiment(userId, experimentData);

      res.status(201).json({
        success: true,
        data: experiment,
      });
    } catch (error: any) {
      logger.error('Error designing experiment:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to design experiment' },
      });
    }
  };

  // Get user experiments
  getUserExperiments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const experiments = await this.timeMachineService.getUserExperiments(userId);

      res.status(200).json({
        success: true,
        data: { experiments },
      });
    } catch (error: any) {
      logger.error('Error getting user experiments:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get user experiments' },
      });
    }
  };

  // Get time machine insights
  getTimeMachineInsights = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const insights = await this.timeMachineService.getTimeMachineInsights(userId);

      res.status(200).json({
        success: true,
        data: insights,
      });
    } catch (error: any) {
      logger.error('Error getting time machine insights:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get time machine insights' },
      });
    }
  };

  // What-if analysis
  whatIfAnalysis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { question, timeframe } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const analysis = await this.timeMachineService.whatIfAnalysis(userId, question, timeframe);

      res.status(200).json({
        success: true,
        data: analysis,
      });
    } catch (error: any) {
      logger.error('Error performing what-if analysis:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to perform what-if analysis' },
      });
    }
  };
}

export default new TimeMachineController();
