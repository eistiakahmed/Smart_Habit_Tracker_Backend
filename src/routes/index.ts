import { Router, type Router as RouterType } from 'express';
import authRoutes from './auth.routes';
import habitRoutes from './habit.routes';
import goalRoutes from './goal.routes';
import gamificationRoutes from './gamification.routes';
import analyticsRoutes from './analytics.routes';
import socialRoutes from './social.routes';
import quickNoteRoutes from './quickNote.routes';
import habitDNARoutes from './habitDNA.routes';
import virtualEconomyRoutes from './virtualEconomy.routes';
import energySchedulingRoutes from './energyScheduling.routes';
import timeMachineRoutes from './timeMachine.routes';
import categoryRoutes from './category.routes';

const router: RouterType = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Smart Habit Tracker API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/habits', habitRoutes);
router.use('/goals', goalRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/social', socialRoutes);
router.use('/quick-notes', quickNoteRoutes);
router.use('/categories', categoryRoutes);

// Unique Features Routes
router.use('/habit-dna', habitDNARoutes);
router.use('/economy', virtualEconomyRoutes);
router.use('/energy', energySchedulingRoutes);
router.use('/timemachine', timeMachineRoutes);

export default router;
