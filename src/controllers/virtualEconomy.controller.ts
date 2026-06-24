import { Response } from 'express';
import { AuthenticatedRequest } from '@/types';
import virtualEconomyService from '@/services/virtualEconomy.service';
import logger from '@/utils/logger';

class VirtualEconomyController {
  private virtualEconomyService = virtualEconomyService;

  // Get user wallet
  getUserWallet = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const wallet = await this.virtualEconomyService.getUserWallet(userId);

      res.status(200).json({
        success: true,
        data: wallet,
      });
    } catch (error: any) {
      logger.error('Error getting user wallet:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get user wallet' },
      });
    }
  };

  // Get wallet balance
  getWalletBalance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const balance = await this.virtualEconomyService.getWalletBalance(userId);

      res.status(200).json({
        success: true,
        data: { balances: balance },
      });
    } catch (error: any) {
      logger.error('Error getting wallet balance:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get wallet balance' },
      });
    }
  };

  // Earn currency
  earnCurrency = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { amount, currency, ...details } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const result = await this.virtualEconomyService.earnCurrency(userId, amount, currency, details);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Error earning currency:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to earn currency' },
      });
    }
  };

  // Spend currency
  spendCurrency = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { amount, currency, ...details } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const result = await this.virtualEconomyService.spendCurrency(userId, amount, currency, details);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Error spending currency:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to spend currency' },
      });
    }
  };

  // Transfer currency
  transferCurrency = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { toUserId, amount, currency, description } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const result = await this.virtualEconomyService.transferCurrency(userId, toUserId, amount, currency, description);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Error transferring currency:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to transfer currency' },
      });
    }
  };

  // Process habit completion rewards
  processHabitCompletion = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { habitId } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const result = await this.virtualEconomyService.processHabitCompletion(userId, habitId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Error processing habit completion:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to process habit completion' },
      });
    }
  };

  // Search marketplace
  searchMarketplace = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const filters = req.query;

      const listings = await this.virtualEconomyService.searchMarketplace(filters);

      res.status(200).json({
        success: true,
        data: { listings },
      });
    } catch (error: any) {
      logger.error('Error searching marketplace:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to search marketplace' },
      });
    }
  };

  // Purchase marketplace listing
  purchaseListing = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { listingId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const result = await this.virtualEconomyService.purchaseListing(userId, listingId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Error purchasing listing:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to purchase listing' },
      });
    }
  };

  // Get user power-ups
  getUserPowerUps = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const powerUps = await this.virtualEconomyService.getUserPowerUps(userId);

      res.status(200).json({
        success: true,
        data: { powerUps },
      });
    } catch (error: any) {
      logger.error('Error getting user power-ups:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get user power-ups' },
      });
    }
  };

  // Use power-up
  usePowerUp = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { powerUpId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const result = await this.virtualEconomyService.usePowerUp(userId, powerUpId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Error using power-up:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to use power-up' },
      });
    }
  };

  // Get economy stats
  getEconomyStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const stats = await this.virtualEconomyService.getEconomyStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Error getting economy stats:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get economy stats' },
      });
    }
  };

  // Get transaction history
  getTransactionHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
        return;
      }

      const transactions = await this.virtualEconomyService.getTransactionHistory(userId, limit);

      res.status(200).json({
        success: true,
        data: { transactions },
      });
    } catch (error: any) {
      logger.error('Error getting transaction history:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get transaction history' },
      });
    }
  };
}

export default new VirtualEconomyController();
