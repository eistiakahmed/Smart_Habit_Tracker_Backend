import { Router } from 'express';
import virtualEconomyController from '@/controllers/virtualEconomy.controller';
import { authenticate } from '@/middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Wallet operations
router.get('/wallet', virtualEconomyController.getUserWallet);
router.get('/balance', virtualEconomyController.getWalletBalance);

// Currency operations
router.post('/earn', virtualEconomyController.earnCurrency);
router.post('/spend', virtualEconomyController.spendCurrency);
router.post('/transfer', virtualEconomyController.transferCurrency);

// Habit completion rewards
router.post('/habit-complete', virtualEconomyController.processHabitCompletion);

// Marketplace operations
router.get('/marketplace/search', virtualEconomyController.searchMarketplace);
router.post('/marketplace/purchase/:listingId', virtualEconomyController.purchaseListing);

// Power-up operations
router.get('/power-ups', virtualEconomyController.getUserPowerUps);
router.post('/power-ups/use/:powerUpId', virtualEconomyController.usePowerUp);

// Analytics
router.get('/stats', virtualEconomyController.getEconomyStats);
router.get('/transactions', virtualEconomyController.getTransactionHistory);

export default router;
